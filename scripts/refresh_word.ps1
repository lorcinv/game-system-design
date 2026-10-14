param(
    [Parameter(Mandatory=$true)][string]$Docx,
    [Parameter(Mandatory=$true)][string]$Pdf
)
$ErrorActionPreference = 'Stop'
$documentPath = (Resolve-Path -LiteralPath $Docx).Path
$pdfPath = [System.IO.Path]::GetFullPath($Pdf)
if ([System.IO.Path]::GetExtension($documentPath) -ne '.docx') { throw 'Input must be a DOCX file.' }
if ([System.IO.Path]::GetExtension($pdfPath) -ne '.pdf') { throw 'Output must be a PDF file.' }
$wordInstance = $null
$openedDocument = $null
try {
    $wordInstance = New-Object -ComObject Word.Application
    $wordInstance.Visible = $false
    $wordInstance.DisplayAlerts = 0
    $wordInstance.AutomationSecurity = 3
    $openedDocument = $wordInstance.Documents.Open($documentPath, $false, $false, $false)
    $null = $openedDocument.Fields.Update()
    foreach ($toc in $openedDocument.TablesOfContents) { $toc.Update() }
    $openedDocument.Repaginate()
    foreach ($toc in $openedDocument.TablesOfContents) { $toc.UpdatePageNumbers() }
    foreach ($section in $openedDocument.Sections) {
        foreach ($footer in $section.Footers) { $null = $footer.Range.Fields.Update() }
    }
    $openedDocument.Save()
    $openedDocument.ExportAsFixedFormat($pdfPath, 17)
    if (!(Test-Path -LiteralPath $pdfPath)) { throw 'Word did not produce the PDF.' }
    [pscustomobject]@{Document=$documentPath; Pdf=$pdfPath; FieldsUpdated=$true} | ConvertTo-Json
}
finally {
    if ($null -ne $openedDocument) { try { $openedDocument.Close(0) } catch {} }
    if ($null -ne $wordInstance) { try { $wordInstance.Quit() } catch {} }
    if ($null -ne $openedDocument) { [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($openedDocument) }
    if ($null -ne $wordInstance) { [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($wordInstance) }
}
