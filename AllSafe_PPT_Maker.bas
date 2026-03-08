Sub CreateAllSafePPT()

    ' ============================================================
    ' ALL SAFE 2.0 - Hackathon Phase 2 PPT Generator
    ' Run this macro inside PowerPoint (Alt+F8 → Run)
    ' ============================================================

    Dim pptApp As Object
    Dim prs As Object
    Dim sld As Object
    Dim shp As Object
    Dim txf As Object
    Dim tf As Object

    ' Colors
    Dim BG_DARK As Long:    BG_DARK = RGB(2, 6, 23)       ' Dark navy
    Dim CYAN As Long:       CYAN = RGB(0, 245, 255)         ' Neon cyan
    Dim WHITE As Long:      WHITE = RGB(255, 255, 255)
    Dim RED As Long:        RED = RGB(255, 46, 91)
    Dim VIOLET As Long:     VIOLET = RGB(124, 58, 237)
    Dim GREEN As Long:      GREEN = RGB(0, 255, 136)
    Dim GRAY As Long:       GRAY = RGB(100, 116, 139)
    Dim CARD As Long:       CARD = RGB(15, 23, 42)

    Set pptApp = Application
    Set prs = pptApp.Presentations.Add(WithWindow:=True)
    prs.PageSetup.SlideWidth = 960
    prs.PageSetup.SlideHeight = 540

    ' ============================================================
    ' Helper: Add a slide with dark background
    ' ============================================================
    Dim slideCount As Integer
    slideCount = 0

    ' ============================================================
    ' SLIDE 1 — TITLE SLIDE
    ' ============================================================
    Set sld = prs.Slides.Add(1, 12) ' ppLayoutBlank
    sld.Background.Fill.ForeColor.RGB = BG_DARK
    sld.Background.Fill.Solid

    ' Glow accent bar (top)
    Set shp = sld.Shapes.AddShape(1, 0, 0, 960, 5)
    With shp.Fill
        .ForeColor.RGB = CYAN
        .Solid
    End With
    shp.Line.Visible = False

    ' Title: ALL SAFE
    Set shp = sld.Shapes.AddTextbox(1, 180, 150, 600, 100)
    With shp.TextFrame.TextRange
        .Text = "ALL SAFE 2.0"
        With .Font
            .Name = "Calibri"
            .Size = 56
            .Bold = True
            .Color.RGB = WHITE
        End With
    End With
    shp.Line.Visible = False
    shp.Fill.Visible = False

    ' Subtitle
    Set shp = sld.Shapes.AddTextbox(1, 180, 255, 600, 50)
    With shp.TextFrame.TextRange
        .Text = "AI-Powered Unified Cybersecurity Platform"
        With .Font
            .Name = "Calibri"
            .Size = 20
            .Color.RGB = CYAN
        End With
    End With
    shp.Line.Visible = False
    shp.Fill.Visible = False

    ' Tagline
    Set shp = sld.Shapes.AddTextbox(1, 180, 315, 600, 40)
    With shp.TextFrame.TextRange
        .Text = "Hackathon Phase 2 | Problem Definition & Idea Submission"
        With .Font
            .Name = "Calibri"
            .Size = 14
            .Color.RGB = GRAY
        End With
    End With
    shp.Line.Visible = False
    shp.Fill.Visible = False

    ' Shield icon placeholder (circle)
    Set shp = sld.Shapes.AddShape(9, 780, 140, 120, 120) ' Oval
    With shp
        .Fill.ForeColor.RGB = RGB(0, 245, 255)
        .Fill.Transparency = 0.85
        .Line.ForeColor.RGB = CYAN
        .Line.Weight = 2
    End With

    ' Team badge
    Set shp = sld.Shapes.AddTextbox(1, 180, 460, 400, 30)
    With shp.TextFrame.TextRange
        .Text = "Team: NEXATHAN  |  Date: March 2026"
        With .Font
            .Name = "Calibri"
            .Size = 12
            .Color.RGB = GRAY
        End With
    End With
    shp.Line.Visible = False
    shp.Fill.Visible = False

    ' Bottom bar
    Set shp = sld.Shapes.AddShape(1, 0, 535, 960, 5)
    With shp.Fill
        .ForeColor.RGB = VIOLET
        .Solid
    End With
    shp.Line.Visible = False

    ' ============================================================
    ' SLIDE 2 — PROBLEM STATEMENT
    ' ============================================================
    Set sld = prs.Slides.Add(2, 12)
    sld.Background.Fill.ForeColor.RGB = BG_DARK
    sld.Background.Fill.Solid

    ' Top bar
    Set shp = sld.Shapes.AddShape(1, 0, 0, 960, 5)
    shp.Fill.ForeColor.RGB = RED
    shp.Fill.Solid
    shp.Line.Visible = False

    ' Section label
    Call AddLabel(sld, "01 / PROBLEM STATEMENT", 50, 25, 300, 30, 11, GRAY)

    ' Heading
    Call AddLabel(sld, "The Cyber Threat Crisis", 50, 55, 600, 60, 34, WHITE)
    Call AddLabel(sld, "That Affects Every Indian Internet User", 50, 100, 700, 40, 22, CYAN)

    ' Problem cards
    Dim problems(4) As String
    Dim pIcons(4) As String
    problems(0) = "Avg Indian user CANNOT identify phishing URLs or fake job offers"
    problems(1) = "No single tool covers URL, IP, File, Phone & Email scanning together"
    problems(2) = "Job scam losses exceed ₹10,000 Crore annually in India"
    problems(3) = "Existing tools require technical expertise — inaccessible to common users"
    problems(4) = "Cyber attacks on Indian systems grew 278% in 2024 (CERT-In Data)"

    Dim i As Integer
    For i = 0 To 4
        Dim yPos As Integer
        yPos = 160 + (i * 68)
        ' Card BG
        Set shp = sld.Shapes.AddShape(5, 48, yPos, 860, 58)
        shp.Fill.ForeColor.RGB = CARD
        shp.Fill.Solid
        shp.Line.ForeColor.RGB = RGB(255, 46, 91)
        shp.Line.Weight = 1
        shp.Line.Transparency = 0.7
        ' Bullet text
        Call AddLabel(sld, "⚠  " & problems(i), 72, yPos + 14, 820, 32, 13, WHITE)
    Next i

    ' ============================================================
    ' SLIDE 3 — TARGET USERS
    ' ============================================================
    Set sld = prs.Slides.Add(3, 12)
    sld.Background.Fill.ForeColor.RGB = BG_DARK
    sld.Background.Fill.Solid

    Set shp = sld.Shapes.AddShape(1, 0, 0, 960, 5)
    shp.Fill.ForeColor.RGB = GREEN
    shp.Fill.Solid
    shp.Line.Visible = False

    Call AddLabel(sld, "02 / TARGET USERS", 50, 25, 300, 30, 11, GRAY)
    Call AddLabel(sld, "Who We Protect", 50, 55, 500, 60, 34, WHITE)

    Dim users(5) As String
    Dim usersDesc(5) As String
    users(0) = "👩‍💼 Job Seekers"
    usersDesc(0) = "2.5 Cr+ youth targeted by job scams annually"
    users(1) = "🎓 College Students"
    usersDesc(1) = "Easily lured into phishing & fake offers"
    users(2) = "🏢 Small Businesses"
    usersDesc(2) = "Lack dedicated cybersecurity tools"
    users(3) = "👨‍💻 Developers / Engineers"
    usersDesc(3) = "Need rapid IOC & domain intelligence"
    users(4) = "🕵️ Cybersecurity Analysts"
    usersDesc(4) = "Require a unified multi-source threat dashboard"
    users(5) = "👨‍👩‍👧 Common Citizens"
    usersDesc(5) = "Elderly, non-technical users falling for online fraud"

    Dim col As Integer, row As Integer
    For i = 0 To 5
        col = i Mod 3
        row = i \ 3
        Dim xc As Integer: xc = 48 + col * 305
        Dim yc As Integer: yc = 155 + row * 165

        Set shp = sld.Shapes.AddShape(5, xc, yc, 280, 140)
        shp.Fill.ForeColor.RGB = CARD
        shp.Fill.Solid
        shp.Line.ForeColor.RGB = CYAN
        shp.Line.Weight = 1.5
        shp.Line.Transparency = 0.6

        Call AddLabel(sld, users(i), xc + 15, yc + 18, 250, 30, 15, CYAN)
        Call AddLabel(sld, usersDesc(i), xc + 15, yc + 60, 250, 55, 12, GRAY)
    Next i

    ' ============================================================
    ' SLIDE 4 — PROPOSED SOLUTION
    ' ============================================================
    Set sld = prs.Slides.Add(4, 12)
    sld.Background.Fill.ForeColor.RGB = BG_DARK
    sld.Background.Fill.Solid

    Set shp = sld.Shapes.AddShape(1, 0, 0, 960, 5)
    shp.Fill.ForeColor.RGB = VIOLET
    shp.Fill.Solid
    shp.Line.Visible = False

    Call AddLabel(sld, "03 / PROPOSED SOLUTION", 50, 25, 400, 30, 11, GRAY)
    Call AddLabel(sld, "ALL SAFE 2.0 — One Platform.", 50, 55, 700, 50, 32, WHITE)
    Call AddLabel(sld, "All Protection.", 50, 100, 400, 40, 32, CYAN)

    Dim features(7) As String
    features(0) = "🌐  Omni Scanner — Auto-detect & scan any URL / IP / Hash / Text"
    features(1) = "🕵️  Job Scam Detector — AI + rule-based, PDF/DOCX upload support"
    features(2) = "📧  Email Header Analyzer — AI-powered phishing header decode"
    features(3) = "🗺  Live Threat Map — Real-time global attack visualization (WebSocket)"
    features(4) = "🤖  AI Chatbot — Chat to trigger any scan using natural language"
    features(5) = "📊  Dashboard — Live System Stats + Historical Intelligence"
    features(6) = "🔑  Password Analyzer — Entropy-based strength checker"
    features(7) = "📄  PDF Reports — Download professional reports for any scan"

    For i = 0 To 7
        Dim fy As Integer: fy = 150 + (i * 47)
        Set shp = sld.Shapes.AddShape(5, 48, fy, 860, 39)
        shp.Fill.ForeColor.RGB = CARD
        shp.Fill.Solid
        If i Mod 2 = 0 Then
            shp.Line.ForeColor.RGB = CYAN
        Else
            shp.Line.ForeColor.RGB = VIOLET
        End If
        shp.Line.Weight = 1
        shp.Line.Transparency = 0.5
        Call AddLabel(sld, features(i), 68, fy + 10, 820, 25, 13, WHITE)
    Next i

    ' ============================================================
    ' SLIDE 5 — TECH STACK
    ' ============================================================
    Set sld = prs.Slides.Add(5, 12)
    sld.Background.Fill.ForeColor.RGB = BG_DARK
    sld.Background.Fill.Solid

    Set shp = sld.Shapes.AddShape(1, 0, 0, 960, 5)
    shp.Fill.ForeColor.RGB = CYAN
    shp.Fill.Solid
    shp.Line.Visible = False

    Call AddLabel(sld, "04 / TECH STACK", 50, 25, 300, 30, 11, GRAY)
    Call AddLabel(sld, "Cutting-Edge Technology, End to End", 50, 55, 700, 50, 30, WHITE)

    ' Frontend Column
    Set shp = sld.Shapes.AddShape(5, 48, 125, 280, 390)
    shp.Fill.ForeColor.RGB = CARD
    shp.Fill.Solid
    shp.Line.ForeColor.RGB = CYAN
    shp.Line.Weight = 1.5
    Call AddLabel(sld, "⚛  FRONTEND", 64, 140, 240, 30, 14, CYAN)
    Dim fe(5) As String
    fe(0) = "React.js + Vite"
    fe(1) = "Framer Motion (Animations)"
    fe(2) = "Lucide React (Icons)"
    fe(3) = "jsPDF + AutoTable"
    fe(4) = "React Globe GL (3D Map)"
    fe(5) = "Axios (HTTP Client)"
    For i = 0 To 5
        Call AddLabel(sld, "▹  " & fe(i), 68, 180 + i * 48, 240, 35, 12, WHITE)
    Next i

    ' Backend Column
    Set shp = sld.Shapes.AddShape(5, 345, 125, 280, 390)
    shp.Fill.ForeColor.RGB = CARD
    shp.Fill.Solid
    shp.Line.ForeColor.RGB = VIOLET
    shp.Line.Weight = 1.5
    Call AddLabel(sld, "🐍  BACKEND", 362, 140, 240, 30, 14, VIOLET)
    Dim be(5) As String
    be(0) = "Python + FastAPI"
    be(1) = "Uvicorn (ASGI Server)"
    be(2) = "SQLite (Logging DB)"
    be(3) = "psutil (System Monitor)"
    be(4) = "PyPDF2 + python-docx"
    be(5) = "WebSockets (Real-Time)"
    For i = 0 To 5
        Call AddLabel(sld, "▹  " & be(i), 365, 180 + i * 48, 240, 35, 12, WHITE)
    Next i

    ' APIs Column
    Set shp = sld.Shapes.AddShape(5, 642, 125, 278, 390)
    shp.Fill.ForeColor.RGB = CARD
    shp.Fill.Solid
    shp.Line.ForeColor.RGB = GREEN
    shp.Line.Weight = 1.5
    Call AddLabel(sld, "🔌  APIs & AI", 660, 140, 240, 30, 14, GREEN)
    Dim ai(5) As String
    ai(0) = "Gemini 2.5 (Google AI)"
    ai(1) = "Groq / LLaMA 3.3 70B"
    ai(2) = "VirusTotal (70+ Engines)"
    ai(3) = "AlienVault OTX"
    ai(4) = "AbuseIPDB + HoneyDB"
    ai(5) = "MaxMind + ThreatFox"
    For i = 0 To 5
        Call AddLabel(sld, "▹  " & ai(i), 662, 180 + i * 48, 240, 35, 12, WHITE)
    Next i

    ' ============================================================
    ' SLIDE 6 — ARCHITECTURE DIAGRAM (text-based)
    ' ============================================================
    Set sld = prs.Slides.Add(6, 12)
    sld.Background.Fill.ForeColor.RGB = BG_DARK
    sld.Background.Fill.Solid

    Set shp = sld.Shapes.AddShape(1, 0, 0, 960, 5)
    shp.Fill.ForeColor.RGB = RED
    shp.Fill.Solid
    shp.Line.Visible = False

    Call AddLabel(sld, "05 / SYSTEM ARCHITECTURE", 50, 25, 500, 30, 11, GRAY)
    Call AddLabel(sld, "How It All Connects", 50, 55, 500, 50, 30, WHITE)

    ' User box
    Call AddBox(sld, 380, 120, 200, 55, RGB(0, 245, 255), "👤 User Browser")
    ' Arrow down
    Call AddLabel(sld, "↓  React (Vite) Frontend", 425, 190, 160, 25, 11, CYAN)
    ' Frontend box
    Call AddBox(sld, 340, 220, 280, 55, VIOLET, "⚛ React App (Omni + Chat + Scanner)")
    ' Arrow
    Call AddLabel(sld, "↓  REST / WebSocket API", 415, 290, 180, 25, 11, VIOLET)
    ' Backend box
    Call AddBox(sld, 320, 320, 320, 55, GREEN, "🐍 FastAPI Backend (Port 8000)")
    ' Arrow
    Call AddLabel(sld, "↓  Parallel Async Calls", 415, 390, 180, 25, 11, GREEN)

    ' API boxes at bottom
    Call AddBox(sld, 48, 420, 165, 60, RED, "VirusTotal API")
    Call AddBox(sld, 228, 420, 165, 60, RGB(245, 158, 11), "Gemini / Groq AI")
    Call AddBox(sld, 408, 420, 165, 60, CYAN, "OTX / HoneyDB")
    Call AddBox(sld, 588, 420, 165, 60, VIOLET, "AbuseIPDB / Fox")
    Call AddBox(sld, 768, 420, 145, 60, GREEN, "MaxMind Risk")

    ' ============================================================
    ' SLIDE 7 — UNIQUE VALUE PROPOSITION
    ' ============================================================
    Set sld = prs.Slides.Add(7, 12)
    sld.Background.Fill.ForeColor.RGB = BG_DARK
    sld.Background.Fill.Solid

    Set shp = sld.Shapes.AddShape(1, 0, 0, 960, 5)
    shp.Fill.ForeColor.RGB = CYAN
    shp.Fill.Solid
    shp.Line.Visible = False

    Call AddLabel(sld, "06 / WHY ALL SAFE WINS", 50, 25, 400, 30, 11, GRAY)
    Call AddLabel(sld, "Our Unfair Advantages", 50, 55, 700, 50, 32, WHITE)

    Dim uvps(5) As String
    uvps(0) = "🔥  ONLY platform that combines URL + IP + Hash + Job Scam + Email + Phone scanning in one UI"
    uvps(1) = "🤖  Natural Language AI Control — type in plain English, our AI runs the right scan automatically"
    uvps(2) = "🗺  Real-time 3D Live Attack Globe powered by YOUR machine's local network + 5 global feeds"
    uvps(3) = "📄  PDF Export  — professional scan reports, judges love downloadable evidence"
    uvps(4) = "🌐  MaxMind Risk Intelligence + HoneyDB Honeypot data — enterprise-grade accuracy"
    uvps(5) = "⚡  Full-stack: React frontend + FastAPI backend, production-deployable in minutes"

    For i = 0 To 5
        yPos = 140 + i * 63
        Set shp = sld.Shapes.AddShape(5, 48, yPos, 860, 54)
        shp.Fill.ForeColor.RGB = CARD
        shp.Fill.Solid
        shp.Line.ForeColor.RGB = CYAN
        shp.Line.Weight = 1
        shp.Line.Transparency = 0.5
        Call AddLabel(sld, uvps(i), 68, yPos + 14, 820, 30, 13, WHITE)
    Next i

    ' ============================================================
    ' SLIDE 8 — CLOSING / CALL TO ACTION
    ' ============================================================
    Set sld = prs.Slides.Add(8, 12)
    sld.Background.Fill.ForeColor.RGB = BG_DARK
    sld.Background.Fill.Solid

    Set shp = sld.Shapes.AddShape(1, 0, 0, 960, 540)
    shp.Fill.ForeColor.RGB = CARD
    shp.Fill.Solid
    shp.Line.Visible = False

    Set shp = sld.Shapes.AddShape(1, 0, 0, 960, 5)
    shp.Fill.ForeColor.RGB = CYAN
    shp.Fill.Solid
    shp.Line.Visible = False

    Set shp = sld.Shapes.AddShape(1, 0, 535, 960, 5)
    shp.Fill.ForeColor.RGB = VIOLET
    shp.Fill.Solid
    shp.Line.Visible = False

    Call AddLabel(sld, "ALL SAFE 2.0", 200, 160, 560, 90, 58, WHITE)
    Call AddLabel(sld, "Protect. Detect. Respond.", 200, 250, 560, 50, 24, CYAN)
    Call AddLabel(sld, "We don't just detect threats — we eliminate them before they reach you.", 120, 310, 720, 50, 14, GRAY)
    Call AddLabel(sld, "Team: NEXATHAN  |  GitHub: github.com/maahi-coder/ALL-SAFE-2.0", 200, 390, 560, 30, 12, GRAY)

    MsgBox "✅ ALL SAFE 2.0 Presentation Created Successfully!" & vbCrLf & "8 Slides ready. Save with Ctrl+S.", vbInformation, "ALL SAFE PPT Done"

End Sub

' ============================================================
' HELPER: Add a styled label / textbox
' ============================================================
Private Sub AddLabel(sld As Object, txt As String, x As Long, y As Long, w As Long, h As Long, sz As Integer, clr As Long)
    Dim shp As Object
    Set shp = sld.Shapes.AddTextbox(1, x, y, w, h)
    With shp.TextFrame
        .WordWrap = True
        .AutoSize = 0
        With .TextRange
            .Text = txt
            With .Font
                .Name = "Calibri"
                .Size = sz
                .Color.RGB = clr
                .Bold = False
            End With
        End With
    End With
    shp.Line.Visible = False
    shp.Fill.Visible = False
End Sub

' ============================================================
' HELPER: Add a styled card/box
' ============================================================
Private Sub AddBox(sld As Object, x As Long, y As Long, w As Long, h As Long, borderClr As Long, label As String)
    Dim shp As Object
    Set shp = sld.Shapes.AddShape(5, x, y, w, h) ' Rounded rect
    shp.Fill.ForeColor.RGB = RGB(15, 23, 42)
    shp.Fill.Solid
    shp.Line.ForeColor.RGB = borderClr
    shp.Line.Weight = 1.5

    Call AddLabel(sld, label, x + 8, y + h / 4, w - 16, h / 2, 11, RGB(255, 255, 255))
End Sub
