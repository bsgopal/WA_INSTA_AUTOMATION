Add-Type -AssemblyName System.Drawing

$src = 'E:\renic_logo.jpeg'
$outDir = 'E:\Deployments\Iaan\WA_Insta_Automation\frontend\build'
$outIco = Join-Path $outDir 'icon.ico'
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

$img = [System.Drawing.Image]::FromFile($src)
Write-Output "Source image: $($img.Width)x$($img.Height)"

$sizes = 16, 24, 32, 48, 64, 128, 256
$pngBlobs = @()
$entries = @()

foreach ($s in $sizes) {
  $bmp = New-Object System.Drawing.Bitmap($s, $s)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.DrawImage($img, 0, 0, $s, $s)
  $g.Dispose()

  $ms = New-Object System.IO.MemoryStream
  $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
  $pngBlobs += , $ms.ToArray()
  $bmp.Dispose()
  $ms.Dispose()

  Write-Output "Rendered ${s}x${s}: $($pngBlobs[-1].Length) bytes"
}

$img.Dispose()

# Build ICO container (PNG-embedded entries, Vista+ compatible)
$count = $sizes.Count
$header = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter($header)
$bw.Write([uint16]0)          # reserved
$bw.Write([uint16]1)          # type: icon
$bw.Write([uint16]$count)

$offset = 6 + (16 * $count)
for ($i = 0; $i -lt $count; $i++) {
  $s = $sizes[$i]
  $bw.Write([byte]($(if ($s -ge 256) { 0 } else { $s })))  # width (0 = 256)
  $bw.Write([byte]($(if ($s -ge 256) { 0 } else { $s })))  # height
  $bw.Write([byte]0)          # palette
  $bw.Write([byte]0)          # reserved
  $bw.Write([uint16]1)        # planes
  $bw.Write([uint16]32)       # bpp
  $bw.Write([uint32]$pngBlobs[$i].Length)
  $bw.Write([uint32]$offset)
  $offset += $pngBlobs[$i].Length
}
foreach ($blob in $pngBlobs) { $bw.Write($blob) }
$bw.Flush()
[System.IO.File]::WriteAllBytes($outIco, $header.ToArray())
$bw.Dispose()
$header.Dispose()

Write-Output "Wrote $outIco ($((Get-Item $outIco).Length) bytes, $count sizes)"