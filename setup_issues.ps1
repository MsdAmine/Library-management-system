$ErrorActionPreference = "Stop"

Write-Host "Creating GitHub Project..."
$projectOutput = gh project create --owner "@me" --title "Library Management System Tasks" --format json
$projectJson = $projectOutput | ConvertFrom-Json
$projectNumber = $projectJson.number
Write-Host "Created Project Number: $projectNumber"

$issues = @(
    @{ title="Implement full Members page in React Frontend"; body="The Members.tsx file is currently just a placeholder. Needs full CRUD integration with backend." },
    @{ title="Implement full Borrowings page in React Frontend"; body="The Borrowings.tsx file is a placeholder. Needs to display current borrowings and allow new borrowing records." },
    @{ title="Add pagination and search to backend API"; body="Books and Members API should support pagination and search functionality for better performance." },
    @{ title="Add unit tests to Spring Boot Controllers"; body="Create basic unit tests for BookController, MemberController, and BorrowingController." },
    @{ title="Improve frontend UI/UX with modern aesthetics"; body="Use vibrant colors, micro-animations, and glassmorphism to make the UI look premium." }
)

foreach ($issue in $issues) {
    Write-Host "Creating issue: $($issue.title)"
    # Capturing the URL returned by the command
    $issueUrl = gh issue create --title $issue.title --body $issue.body
    
    if ($issueUrl -match "https://github.com") {
        Write-Host "Created issue: $issueUrl"
        Write-Host "Adding to project $projectNumber"
        gh project item-add $projectNumber --owner "@me" --url $issueUrl
    } else {
        Write-Host "Failed to parse issue URL: $issueUrl"
    }
}

Write-Host "Done!"
