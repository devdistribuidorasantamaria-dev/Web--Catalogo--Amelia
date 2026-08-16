<?php

/**
 * Genera los iconos del navegador a partir del logotipo de la marca.
 *
 * El logotipo es un wordmark apaisado (472x247): metido entero en 16x16 sería una
 * mancha gris. Se recorta la «A» manuscrita, que es la parte distintiva y aguanta
 * el tamaño de una pestaña.
 *
 * Está en PHP y no en Node porque el logotipo vive en el backend Laravel y la
 * extensión GD ya es un requisito de ese proyecto; el frontend no tiene ninguna
 * dependencia de imágenes y no valía la pena añadirle una sólo para esto.
 *
 * Uso:
 *   php scripts/generar-iconos.php <logotipo.png> [tira-de-control.png]
 *
 * Ejemplo, con el logotipo tal como lo guarda el panel:
 *   php scripts/generar-iconos.php \
 *     ../amelia-backend/storage/app/public/marca/<archivo>.png /tmp/tira.png
 *
 * Escribe en src/app/: favicon.ico (16/32/48), icon.png (512) y apple-icon.png
 * (180). Next los detecta por el nombre y emite las etiquetas <link> solo.
 */

$origen = $argv[1] ?? '';
$tira = $argv[2] ?? '';

if ($origen === '' || ! is_file($origen)) {
    fwrite(STDERR, "Uso: php scripts/generar-iconos.php <logotipo.png> [tira.png]\n");
    exit(1);
}

$salida = __DIR__.'/../src/app';

// Recorte de la «A» dentro del logotipo, medido sobre el perfil de tinta del
// archivo actual. Si el cliente cambia el logotipo hay que volver a medirlo.
[$rx, $ry, $rw, $rh] = [24, 14, 152, 170];

$lado = 512;
$margen = 0.10;   // aire alrededor del glifo, en fracción del lado

/**
 * Engrosa el trazo un píxel. El logotipo es manuscrito y muy fino: al bajar a
 * 16 px el trazo ocupa menos de un píxel y el glifo se desvanece.
 */
function engrosar(GdImage $im): GdImage
{
    $w = imagesx($im);
    $h = imagesy($im);
    $destino = imagecreatetruecolor($w, $h);

    for ($y = 0; $y < $h; $y++) {
        for ($x = 0; $x < $w; $x++) {
            $propio = imagecolorat($im, $x, $y) & 0xFF;
            $max = $propio;

            // Sólo los cuatro vecinos ortogonales: con los ocho, el trazo se
            // engorda en diagonal y la letra deja de parecer manuscrita.
            foreach ([[0, -1], [0, 1], [-1, 0], [1, 0]] as [$dx, $dy]) {
                $nx = $x + $dx;
                $ny = $y + $dy;

                if ($nx < 0 || $ny < 0 || $nx >= $w || $ny >= $h) {
                    continue;
                }

                $max = max($max, imagecolorat($im, $nx, $ny) & 0xFF);
            }

            // Mezcla con el original: da cuerpo sin comerse el remate fino.
            $v = (int) round($propio * 0.35 + $max * 0.65);
            imagesetpixel($destino, $x, $y, imagecolorallocate($destino, $v, $v, $v));
        }
    }

    return $destino;
}

/**
 * Marca la imagen para que se guarde con canal alfa. El icono es opaco, pero
 * Next rechaza los PNG de icono que no vengan en RGBA («The PNG is not in RGBA
 * format!»), así que hay que escribir el canal aunque valga siempre 255.
 */
function conAlfa(GdImage $im): GdImage
{
    imagealphablending($im, false);
    imagesavealpha($im, true);

    return $im;
}

/** Reescala el icono maestro al tamaño pedido, engrosando si es diminuto. */
function aTamano(GdImage $maestro, int $t): GdImage
{
    $lado = imagesx($maestro);
    $chico = imagecreatetruecolor($t, $t);
    imagecopyresampled($chico, $maestro, 0, 0, 0, 0, $t, $t, $lado, $lado);

    return conAlfa($t <= 16 ? engrosar($chico) : $chico);
}

/**
 * Escribe un .ico con varios tamaños. Se arma a mano porque GD no exporta ICO.
 * Un ICO puede llevar PNG dentro tal cual (Vista en adelante), así que basta la
 * cabecera más los PNG concatenados.
 *
 * @param  array<int, int>  $tamanos
 */
function escribirIco(GdImage $maestro, array $tamanos, string $ruta): void
{
    $imagenes = [];

    foreach ($tamanos as $t) {
        ob_start();
        imagepng(aTamano($maestro, $t), null, 9);
        $imagenes[$t] = ob_get_clean();
    }

    // ICONDIR: reservado, tipo 1 = icono, número de imágenes.
    $cabecera = pack('vvv', 0, 1, count($imagenes));
    // Cada ICONDIRENTRY ocupa 16 bytes; los datos van después de todas ellas.
    $desplazamiento = 6 + 16 * count($imagenes);
    $entradas = '';

    foreach ($imagenes as $t => $datos) {
        $entradas .= pack(
            'CCCCvvVV',
            $t >= 256 ? 0 : $t,   // 0 significa 256
            $t >= 256 ? 0 : $t,
            0,                    // paleta: 0 = sin paleta
            0,                    // reservado
            1,                    // planos
            32,                   // bits por píxel
            strlen($datos),
            $desplazamiento
        );
        $desplazamiento += strlen($datos);
    }

    file_put_contents($ruta, $cabecera.$entradas.implode('', $imagenes));
    printf("favicon.ico   %s\n", implode(' / ', array_keys($imagenes)));
}

$logo = imagecreatefrompng($origen);

// El archivo del cliente viene con fondo negro opaco, no con alfa. Se recorta el
// glifo y se remonta centrado sobre un cuadrado negro, el fondo de la marca.
$recorte = imagecreatetruecolor($rw, $rh);
imagecopy($recorte, $logo, 0, 0, $rx, $ry, $rw, $rh);

$icono = imagecreatetruecolor($lado, $lado);
imagefill($icono, 0, 0, imagecolorallocate($icono, 0, 0, 0));

$util = (int) round($lado * (1 - $margen * 2));
$escala = min($util / $rw, $util / $rh);
$dw = (int) round($rw * $escala);
$dh = (int) round($rh * $escala);

imagecopyresampled(
    $icono, $recorte,
    (int) round(($lado - $dw) / 2), (int) round(($lado - $dh) / 2),
    0, 0, $dw, $dh, $rw, $rh
);

imagepng(conAlfa($icono), "{$salida}/icon.png", 9);
printf("icon.png      %dx%d\n", $lado, $lado);

// apple-icon.png: iOS lo usa al guardar el catálogo en la pantalla de inicio.
imagepng(aTamano($icono, 180), "{$salida}/apple-icon.png", 9);
printf("apple-icon    180x180\n");

escribirIco($icono, [16, 32, 48], "{$salida}/favicon.ico");

// Tira de control opcional: los tamaños a los que se ve de verdad, sobre fondo
// claro y oscuro, para comprobar de un vistazo que la «A» se sigue leyendo.
if ($tira !== '') {
    $tamanos = [16, 24, 32, 48, 64, 128];
    $ancho = array_sum($tamanos) + 20 * (count($tamanos) + 1);
    $lienzo = imagecreatetruecolor($ancho, 200);
    imagefill($lienzo, 0, 0, imagecolorallocate($lienzo, 245, 245, 245));
    imagefilledrectangle($lienzo, 0, 100, $ancho, 200, imagecolorallocate($lienzo, 30, 30, 30));

    $x = 20;

    foreach ($tamanos as $t) {
        $chico = aTamano($icono, $t);

        foreach ([50, 150] as $cy) {
            imagecopy($lienzo, $chico, $x, $cy - (int) ($t / 2), 0, 0, $t, $t);
        }

        $x += $t + 20;
    }

    imagepng($lienzo, $tira, 9);
    printf("tira          %s\n", $tira);
}
