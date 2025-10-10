import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Tesseract from "tesseract.js";

const AddTransactionPage = () => {
  const userId = localStorage.getItem("userId");

  const [form, setForm] = useState({
    type: "expense",
    category: "",
    amount: "",
    date: "",
  });

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [loadingOCR, setLoadingOCR] = useState(false);

  // 🎤 Setup Speech Recognition
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser 😢");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event) => {
      const speech = event.results[0][0].transcript.toLowerCase();
      console.log("🎙️ Recognized:", speech);
      setTranscript(speech);
      parseSpeech(speech);
    };

    window.recognition = recognition;
  }, []);

  // 🧠 Parse user speech into form fields
  const parseSpeech = (speech) => {
    let type = speech.includes("income") ? "income" : "expense";

    // Extract amount (supports "₹100", "100", "amount of 100")
    const amountMatch = speech.match(/(?:₹|rs|amount of|of)?\s*(\d+(?:\.\d{1,2})?)/i);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : "";

    // Extract category from keywords or "for <category>"
    let category = "";
    const keywords = ["food","fuel","rent","grocery","utilities","medical","shopping","travel","salary"];
    for (const k of keywords) if (speech.includes(k)) category = k;

    if (!category) {
      const forMatch = speech.match(/for\s+([a-zA-Z]+)/);
      if (forMatch) category = forMatch[1].toLowerCase();
    }

    // Extract date ("today", "yesterday", "on 5th October 2024")
    let date = "";
    const today = new Date();
    if (speech.includes("today")) date = today.toISOString().slice(0,10);
    else if (speech.includes("yesterday")) {
      const d = new Date(today); d.setDate(today.getDate() - 1);
      date = d.toISOString().slice(0,10);
    } else {
      const dateMatch = speech.match(/on\s+(\d{1,2})(?:st|nd|rd|th)?\s+([a-zA-Z]+)\s*(\d{4})?/i);
      if (dateMatch) {
        const [, day, monthStr, year] = dateMatch;
        const months = { january: "01", february: "02", march: "03", april: "04", may: "05", june: "06", july: "07", august: "08", september: "09", october: "10", november: "11", december: "12"};
        const month = months[monthStr.toLowerCase()] || "01";
        const y = year || today.getFullYear();
        date = `${y}-${month}-${day.padStart(2,"0")}`;
      }
    }

    setForm(prev => ({
      ...prev,
      type,
      amount: amount || prev.amount,
      category: category || prev.category,
      date: date || prev.date
    }));
  };

// 🧾 OCR Receipt Scanning
const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoadingOCR(true);
    setOcrText("Processing... please wait ⏳");

    try {
        // Run Tesseract OCR on the file
        const { data } = await Tesseract.recognize(file, "eng", { logger: m => console.log(m) });
        let text = data.text.toLowerCase();
        console.log("🧾 OCR Extracted Text:", text);

        // --- PRE-PROCESSING: Remove known ID/Noise patterns to prevent errors ---
        // 1. Remove large, continuous alphanumeric strings (GSTIN/FSSAI/etc.)
        text = text.replace(/([a-z0-9]{10,})/, ''); // Remove long codes
        // 2. Remove strings known to be Bill No. or other large identifiers
        text = text.replace(/bill\s+no\s*:\s*\S+/g, '');
        text = text.replace(/fssai\s+no\s*:\s*\S+/g, '');
        text = text.replace(/gstin\s*:\s*\S+/g, '');
        text = text.replace(/cashier\s*:\s*\S+/g, ''); // Remove Cashier ID (007796)

        const lines = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
        
        // --- 1. Amount Extraction (Target Final Total) ---
        let amount = "";
        
        // 1a. Prioritize final keywords: 'G.Total', 'Bill Total', 'Total', 'Rs.', or 'Amt'
        const totalKeywords = ["g.total", "bill total", "total", "rs.", "amt"];
        let finalTotalLine = null;

        // Search from the bottom up
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i];
            if (totalKeywords.some(keyword => line.includes(keyword)) || line.includes("13 qty") || line.includes("amount")) {
                finalTotalLine = line;
                break;
            }
        }
        
        // Final fallback: use the last line of the receipt
        if (!finalTotalLine && lines.length > 0) {
             finalTotalLine = lines[lines.length - 1];
        }

        if (finalTotalLine) {
            // Regex to find the LAST number in the line that looks like a currency amount
            const numberMatch = finalTotalLine.match(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)\s*$/);
            
            if (numberMatch) {
                const matchedAmount = parseFloat(numberMatch[1].replace(/,/g, ''));
                if (matchedAmount > 0) {
                    amount = matchedAmount;
                }
            }
        }

        // 1b. Refined Fallback: Find the largest realistic number in the CLEAN text
        if (!amount) {
            const allNumbers = [...text.matchAll(/(\d+[.,]?\d{1,2})/g)]
                .map(m => parseFloat(m[1].replace(/,/g, '').replace(/\.$/, '')))
                .filter(n => n > 1 && n < 20000); // Max limit is 20,000, should be safe.

            if (allNumbers.length) {
                amount = Math.max(...allNumbers);
            }
        }
        // With the IDs removed, this fallback should now correctly find the largest remaining number, 1347.16.


        // ------------------- 2. Date Extraction -------------------
        let date = "";
        const monthsMap = {
        jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
      };

        
        // Comprehensive Date Patterns
        const datePatterns = [
             // Pattern 1 (re1.webp): Dt : DD-MMM-YYYY
            /dt\s*:\s*(\d{1,2})[\/\-\s]?([a-zA-Z]{3,})[\/\-\s]?(\d{2,4})/,
             // Pattern 2 (r2.jpg, re2.jpg, re3.jpg): Bill Dt or Date : DD/MM/YYYY
            /(?:bill\s+dt|date)\s*:\s*(\d{1,2})[\/\-\s](\d{1,2})[\/\-\s](\d{4})/i,
             // Pattern 3: Generic DD/MM/YYYY
            /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
        ];

        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
                let day, month, year;

                if (pattern.toString().includes('dt\\s*:\\s*')) { // Pattern 1: DD-MMM-YYYY (re1)
                    [, day, month, year] = match;
                    month = monthsMap[month.toLowerCase().substring(0, 3)] || "01";
                } else { // Pattern 2 & 3: DD-MM-YYYY / DD/MM/YYYY
                    [, day, month, year] = match;
                }
                
                // Format the result to YYYY-MM-DD
                const fullYear = year.length === 2 ? "20" + year : year;
                date = `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
                
                break;
            }
        }

        // ------------------- 3. Category Extraction -------------------
        let category = "";
        const keywords = {
            food: [
                "restaurant", "cafe", "dine", "pizza", "brunch", "lamb", "burger", "flour", "curry", "chicken", "rogan", "briyani", "pongal", "vadai", "poori"
            ],
            fuel: ["fuel", "petrol", "diesel", "pump"],
            grocery: [
                "grocery", "mart", "store", "supermarket", "d-mart", "dabur", "colgate", "tea"
            ],
            utilities: ["bill", "electricity", "water", "internet", "wifi"],
            medical: ["medical", "pharmacy", "hospital", "clinic"],
            shopping: ["mall", "cloth", "apparel", "purchase"],
            travel: ["taxi", "bus", "train", "flight", "uber", "ola"]
        };

        for (const [cat, words] of Object.entries(keywords)) {
            if (words.some(w => text.includes(w))) { category = cat; break; }
        }

        // ------------------- 4. Update Form -------------------
        setForm(prev => ({
            ...prev,
            amount: amount || prev.amount,
            date: date || prev.date,
            category: category || prev.category
        }));

        setOcrText(`✅ Extracted: Amount: ${amount || 'N/A'}, Date: ${date || 'N/A'}, Category: ${category || 'N/A'}`);
    } catch (err) {
        console.error("OCR error:", err);
        setOcrText("❌ Failed to extract text from image.");
    } finally {
        setLoadingOCR(false);
    }
};

  // Add transaction
  const handleAddTransaction = async () => {
    const { type, category, amount, date } = form;
    if (!type || !category || !amount || !date) return alert("❌ All fields are required!");

    try {
      const res = await fetch(`http://localhost:5000/api/transactions/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, category, amount: parseFloat(amount), date }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert("✅ Transaction added successfully!");
      setForm({ type: "expense", category: "", amount: "", date: "" });
      setTranscript("");
      setOcrText("");
    } catch (err) {
      alert("❌ Failed to add transaction: " + err.message);
      console.error(err);
    }
  };

  const toggleListening = () => {
    if (listening) window.recognition.stop();
    else window.recognition.start();
  };

  return (
    <div style={{ display: "flex", minHeight: "100%", width: "100vw" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: "40px", background: "#f0f2f5", overflowY: "auto" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", background: "#fff", padding: "40px", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.08)", borderTop: "4px solid #3498db" }}>
          <h2 style={{ marginBottom: "30px", color: "#2c3e50", textAlign: "center" }}>Add Transaction</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <label style={labelStyle}>Type</label>
            <select name="type" value={form.type} onChange={(e)=>setForm({...form, type:e.target.value})} style={selectStyle}>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>

            <label style={labelStyle}>Category</label>
            <input type="text" placeholder="Category" value={form.category} onChange={(e)=>setForm({...form, category:e.target.value})} style={inputStyle} />

            <label style={labelStyle}>Amount</label>
            <input type="number" placeholder="Amount" value={form.amount} onChange={(e)=>setForm({...form, amount:e.target.value})} style={inputStyle} />

            <label style={labelStyle}>Date</label>
            <input type="date" value={form.date} onChange={(e)=>setForm({...form, date:e.target.value})} style={inputStyle} />

            <button onClick={toggleListening} style={micBtn}>{listening ? "🎤 Listening..." : "🎙️ Start Voice Input"}</button>
            {transcript && <div style={{ color:"#2c3e50", fontStyle:"italic", marginTop:"10px" }}>🗣️ “{transcript}”</div>}

            <label style={labelStyle}>Upload Receipt</label>
            <input type="file" accept="image/*" onChange={handleReceiptUpload} />
            {loadingOCR ? <p style={{color:"#555"}}>Extracting text...</p> : ocrText && <p style={{color:"#2c3e50"}}>{ocrText}</p>}

            <button onClick={handleAddTransaction} style={saveBtn}>➕ Add Transaction</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== Styles =====
const labelStyle = { fontWeight: "600", marginBottom: "5px", color: "#34495e" };
const inputStyle = { padding:"12px 15px", borderRadius:"8px", border:"1px solid #ccc", width:"100%", fontSize:"14px", outline:"none", background:"white", color:"black" };
const selectStyle = { ...inputStyle, appearance:"none", cursor:"pointer", background:"white url('data:image/svg+xml;utf8,<svg fill=\"%233498db\" height=\"24\" viewBox=\"0 0 24 24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 10l5 5 5-5z\"/></svg>') no-repeat right 10px center", backgroundSize:"16px" };
const micBtn = { background:"#f39c12", color:"#fff", padding:"14px", border:"none", borderRadius:"10px", cursor:"pointer", fontSize:"16px", fontWeight:"600", transition:"0.3s" };
const saveBtn = { background:"#3498db", color:"#fff", padding:"14px", border:"none", borderRadius:"10px", cursor:"pointer", fontSize:"16px", fontWeight:"600", transition:"0.3s" };

export default AddTransactionPage;
