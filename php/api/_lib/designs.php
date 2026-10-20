<?php
// 디자인 저장: JSON + 썸네일 + 인쇄용 PNG(300dpi) + PDF(실제 mm 크기) + CMYK TIFF.
// (src/app/editor/[slug]/actions.ts 의 saveDesignAction. sharp·pdf-lib 대신 GD 와 순수 PHP 로 만든다)
// CMYK 는 ICC 프로필 없는 단순 변환(최대 농도 기준)이다. 인쇄소 전달용 참고본.

declare(strict_types=1);

require_once __DIR__ . '/storage.php';
require_once __DIR__ . '/dbapi.php';

const MM_TO_PT = 72 / 25.4;
const MAX_PRINT_BYTES = 30 * 1024 * 1024;

function uploaded_bytes(string $field, int $max): ?string
{
    $f = $_FILES[$field] ?? null;
    if (!is_array($f) || ($f['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) return null;
    if ((int) $f['size'] > $max) fail('디자인 파일이 너무 큽니다.', 413);
    $b = file_get_contents($f['tmp_name']);
    return $b === false ? null : $b;
}

/** multipart: designId? productId colorId name doc(JSON) + files thumbnail, printPng */
function save_design(array $user): array
{
    $productId = str_($_POST['productId'] ?? '', 64);
    $product = db_get('products', ['id' => $productId]);
    if (!$product) return ['ok' => false, 'error' => '제품을 찾을 수 없습니다.'];
    $doc = json_decode((string) ($_POST['doc'] ?? ''), true);
    if (!is_array($doc) || !is_array($doc['label'] ?? null)) return ['ok' => false, 'error' => '디자인 데이터가 올바르지 않습니다.'];
    $png = uploaded_bytes('printPng', MAX_PRINT_BYTES);
    $thumb = uploaded_bytes('thumbnail', 5 * 1024 * 1024);
    if ($png === null || $thumb === null) return ['ok' => false, 'error' => '인쇄용 이미지가 없습니다.'];

    $designId = str_($_POST['designId'] ?? '', 64);
    if ($designId !== '') {
        $existing = db_get('designs', ['id' => $designId]);
        if (!$existing || $existing['user_id'] !== $user['id']) $designId = '';
    }
    if ($designId === '') $designId = uuid4();
    $colorId = str_($_POST['colorId'] ?? '', 64) ?: null;
    $name = mb_substr(str_($_POST['name'] ?? '', 200), 0, 60) ?: '내 디자인';

    // 작업 사이즈(mm): 재단 + 도련 양쪽
    $label = $doc['label'];
    $w = (float) ($label['width_mm'] ?? $product['label_width_mm']) + 2 * (float) ($label['bleed_mm'] ?? $product['label_bleed_mm']);
    $h = (float) ($label['height_mm'] ?? $product['label_height_mm']) + 2 * (float) ($label['bleed_mm'] ?? $product['label_bleed_mm']);

    $printPng = png_with_dpi($png, 300);
    [$pw, $ph, $rgb] = png_to_rgb($png);
    $pdf = rgb_to_pdf($rgb, $pw, $ph, $w, $h, $product['name_ko'] . ' 라벨');
    $tiff = rgb_to_cmyk_tiff($rgb, $pw, $ph, 300);

    $base = "{$user['id']}/$designId";
    $stamp = (int) (microtime(true) * 1000);
    $thumbUrl = put_file('designs', "$base/thumb-$stamp.png", $thumb);
    $pngUrl = put_file('designs', "$base/print-$stamp.png", $printPng);
    $pdfUrl = put_file('designs', "$base/print-$stamp.pdf", $pdf);
    $cmykUrl = put_file('designs', "$base/print-cmyk-$stamp.tif", $tiff);

    $row = [
        'user_id' => $user['id'], 'product_id' => $product['id'], 'color_id' => $colorId, 'name' => $name, 'canvas_json' => $doc,
        'thumbnail_url' => $thumbUrl, 'print_png_url' => $pngUrl, 'print_pdf_url' => $pdfUrl, 'print_cmyk_url' => $cmykUrl,
    ];
    if (db_get('designs', ['id' => $designId])) db_update('designs', ['id' => $designId], $row);
    else db_insert('designs', ['id' => $designId] + $row);
    return ['ok' => true, 'designId' => $designId];
}

// ───────── PNG: pHYs(해상도) 청크 ─────────

function png_chunk(string $type, string $data): string
{
    return pack('N', strlen($data)) . $type . $data . pack('N', crc32($type . $data));
}

function png_with_dpi(string $png, int $dpi): string
{
    if (substr($png, 0, 8) !== "\x89PNG\r\n\x1a\n") return $png;
    $ppm = (int) round($dpi / 0.0254);
    $out = substr($png, 0, 8);
    $pos = 8;
    $len = strlen($png);
    $inserted = false;
    while ($pos + 8 <= $len) {
        $size = unpack('N', substr($png, $pos, 4))[1];
        $type = substr($png, $pos + 4, 4);
        $chunk = substr($png, $pos, 12 + $size);
        $pos += 12 + $size;
        if ($type === 'pHYs') continue; // 기존 해상도 정보는 버린다
        $out .= $chunk;
        if ($type === 'IHDR' && !$inserted) {
            $out .= png_chunk('pHYs', pack('NNC', $ppm, $ppm, 1));
            $inserted = true;
        }
    }
    return $out;
}

// ───────── PNG → RGB 바이트 (흰 배경으로 합침) ─────────

/** @return array{int,int,string} 가로, 세로, RGB 바이트(가로×세로×3) */
function png_to_rgb(string $png): array
{
    $src = @imagecreatefromstring($png);
    if (!$src) fail('인쇄용 이미지를 읽지 못했습니다.', 400);
    $w = imagesx($src);
    $h = imagesy($src);
    $img = imagecreatetruecolor($w, $h);
    imagealphablending($img, true);
    imagefilledrectangle($img, 0, 0, $w, $h, imagecolorallocate($img, 255, 255, 255));
    imagecopy($img, $src, 0, 0, 0, 0, $w, $h);
    imagedestroy($src);
    $rgb = '';
    for ($y = 0; $y < $h; $y++) {
        $line = '';
        for ($x = 0; $x < $w; $x++) {
            $c = imagecolorat($img, $x, $y);
            $line .= chr(($c >> 16) & 0xff) . chr(($c >> 8) & 0xff) . chr($c & 0xff);
        }
        $rgb .= $line;
    }
    imagedestroy($img);
    return [$w, $h, $rgb];
}

// ───────── PDF (이미지 한 장, 실제 mm 크기) ─────────

function pdf_text(string $s): string
{
    return '<FEFF' . strtoupper(bin2hex(mb_convert_encoding($s, 'UTF-16BE', 'UTF-8'))) . '>';
}

function rgb_to_pdf(string $rgb, int $pw, int $ph, float $wMm, float $hMm, string $title): string
{
    $W = $wMm * MM_TO_PT;
    $H = $hMm * MM_TO_PT;
    $image = gzcompress($rgb, 6);
    $content = sprintf('q %.4F 0 0 %.4F 0 0 cm /Im0 Do Q', $W, $H);
    $objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        sprintf('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %.4F %.4F] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>', $W, $H),
        sprintf("<< /Type /XObject /Subtype /Image /Width %d /Height %d /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length %d >>\nstream\n%s\nendstream", $pw, $ph, strlen($image), $image),
        sprintf("<< /Length %d >>\nstream\n%s\nendstream", strlen($content), $content),
        '<< /Title ' . pdf_text($title) . ' /Producer (TERRYWELL) /CreationDate (D:' . gmdate('YmdHis') . "Z) >>",
    ];
    $out = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
    $offsets = [];
    foreach ($objects as $i => $body) {
        $offsets[] = strlen($out);
        $out .= ($i + 1) . " 0 obj\n$body\nendobj\n";
    }
    $xref = strlen($out);
    $out .= 'xref\n0 ' . (count($objects) + 1) . "\n0000000000 65535 f \n";
    $out = str_replace('xref\n', "xref\n", $out);
    foreach ($offsets as $o) $out .= sprintf("%010d 00000 n \n", $o);
    $out .= '<< /Size ' . (count($objects) + 1) . " /Root 1 0 R /Info 6 0 R >>\n";
    $out = str_replace("<< /Size", "trailer\n<< /Size", $out);
    $out .= "startxref\n$xref\n%%EOF\n";
    return $out;
}

// ───────── CMYK TIFF (무압축, 300dpi) ─────────

function rgb_to_cmyk_tiff(string $rgb, int $w, int $h, int $dpi): string
{
    $n = $w * $h;
    $cmyk = '';
    $cache = [];
    for ($i = 0; $i < $n; $i++) {
        $p = substr($rgb, $i * 3, 3);
        if (!isset($cache[$p])) {
            $r = ord($p[0]) / 255;
            $g = ord($p[1]) / 255;
            $b = ord($p[2]) / 255;
            $k = 1 - max($r, $g, $b);
            if ($k >= 0.999) {
                $c = $m = $y = 0.0;
                $k = 1.0;
            } else {
                $c = (1 - $r - $k) / (1 - $k);
                $m = (1 - $g - $k) / (1 - $k);
                $y = (1 - $b - $k) / (1 - $k);
            }
            $cache[$p] = chr((int) round($c * 255)) . chr((int) round($m * 255)) . chr((int) round($y * 255)) . chr((int) round($k * 255));
        }
        $cmyk .= $cache[$p];
    }
    $entries = [];
    $ifdOffset = 8;
    $count = 15;
    $extra = $ifdOffset + 2 + $count * 12 + 4; // 추가 데이터 시작
    $bpsOffset = $extra;            // BitsPerSample 4×SHORT = 8 bytes
    $xresOffset = $bpsOffset + 8;   // RATIONAL 8 bytes
    $yresOffset = $xresOffset + 8;
    $dataOffset = $yresOffset + 8;
    $e = fn (int $tag, int $type, int $cnt, int $val) => pack('vvVV', $tag, $type, $cnt, $val);
    $short = fn (int $tag, int $val) => pack('vvVvv', $tag, 3, 1, $val, 0);
    $entries[] = $e(256, 4, 1, $w);            // ImageWidth
    $entries[] = $e(257, 4, 1, $h);            // ImageLength
    $entries[] = $e(258, 3, 4, $bpsOffset);    // BitsPerSample
    $entries[] = $short(259, 1);               // Compression none
    $entries[] = $short(262, 5);               // Photometric separated (CMYK)
    $entries[] = $e(273, 4, 1, $dataOffset);   // StripOffsets
    $entries[] = $short(274, 1);               // Orientation
    $entries[] = $short(277, 4);               // SamplesPerPixel
    $entries[] = $e(278, 4, 1, $h);            // RowsPerStrip
    $entries[] = $e(279, 4, 1, strlen($cmyk)); // StripByteCounts
    $entries[] = $e(282, 5, 1, $xresOffset);   // XResolution
    $entries[] = $e(283, 5, 1, $yresOffset);   // YResolution
    $entries[] = $short(284, 1);               // PlanarConfiguration chunky
    $entries[] = $short(296, 2);               // ResolutionUnit inch
    $entries[] = $short(332, 1);               // InkSet CMYK
    $out = 'II' . pack('vV', 42, $ifdOffset) . pack('v', $count) . implode('', $entries) . pack('V', 0);
    $out .= pack('vvvv', 8, 8, 8, 8) . pack('VV', $dpi, 1) . pack('VV', $dpi, 1);
    return $out . $cmyk;
}
