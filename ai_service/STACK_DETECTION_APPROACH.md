# Stack Detection Approach - Quick Reference

## 🎯 **Your Vision Implementation**

### **Step 1: File & Package Analysis (Rule-Based)**
```python
# 1. Read repository structure
file_list = await github_client.get_file_structure(repo_url)

# 2. Analyze package files (HIGH ACCURACY)
package_files = {
    "package.json": await github_client.get_file_content("package.json"),
    "requirements.txt": await github_client.get_file_content("requirements.txt"),
    "pom.xml": await github_client.get_file_content("pom.xml"),
    # ... other package files
}

# 3. Get key application files
key_files = {
    "src/App.js": await github_client.get_file_content("src/App.js"),
    "app.py": await github_client.get_file_content("app.py"),
    "main.java": await github_client.get_file_content("main.java"),
    # ... other key files
}

# 4. Rule-based analysis
rule_result = analyze_with_patterns(file_list, package_files, key_files)
```

### **Step 2: LLM Enhancement (When Needed)**
```python
# 5. Use LLM if confidence < 80%
if rule_result.confidence < 0.80:
    llm_prompt = create_smart_prompt(file_list, package_files, key_files, rule_result)
    llm_result = await groq_llm.analyze(llm_prompt)
    final_result = combine_results(rule_result, llm_result)
else:
    final_result = rule_result
```

## 📊 **Accuracy Strategy**

| Data Source | Weight | Reliability | Example |
|-------------|--------|-------------|---------|
| package.json dependencies | 50% | Very High | `"react": "18.2.0"` → React app |
| File structure patterns | 20% | Medium | `src/components/` → Frontend framework |
| Code content analysis | 30% | High | `import React from 'react'` → React |
| LLM enhancement | +10% | High | Resolves conflicts & edge cases |

## 🔍 **Detection Examples**

### **React App Detection**
```python
# package.json analysis (50% weight)
dependencies = {"react": "18.2.0", "react-dom": "18.2.0"}
→ Framework: "react", Confidence: 0.9

# File structure (20% weight)  
files = ["src/App.js", "src/components/", "public/index.html"]
→ Pattern: "react", Confidence: 0.8

# Content analysis (30% weight)
app_js_content = "import React from 'react'..."
→ Import: "react", Confidence: 0.95

# Final: 0.9*0.5 + 0.8*0.2 + 0.95*0.3 = 0.9 (90% confidence)
```

### **Django App Detection**
```python
# requirements.txt analysis (50% weight)
packages = ["Django==4.2.0", "djangorestframework"]
→ Framework: "django", Confidence: 0.95

# File structure (20% weight)
files = ["manage.py", "settings.py", "urls.py", "models.py"]
→ Pattern: "django", Confidence: 0.9

# Content analysis (30% weight)
settings_content = "from django.conf import settings..."
→ Import: "django", Confidence: 0.9

# Final: 0.95*0.5 + 0.9*0.2 + 0.9*0.3 = 0.925 (92.5% confidence)
```

## 🤖 **LLM Enhancement Example**

### **When Rule-Based is Uncertain**
```python
# Scenario: Multiple frameworks detected
rule_result = {
    "possible_frameworks": ["express", "nextjs"],
    "confidence": 0.65,  # Low confidence
    "conflicts": ["Both Express and Next.js patterns found"]
}

# LLM Prompt
prompt = f"""
Repository has both Express and Next.js patterns:
- package.json: {{"next": "13.0.0", "express": "4.18.0"}}
- Files: ["pages/", "api/", "server.js"]
- Content: "import express" AND "export default function Page()"

Is this: 1) Next.js app with custom server, 2) Express app with Next.js frontend, 3) Monorepo?
"""

# LLM Response
llm_result = {
    "framework": "nextjs",
    "confidence": 0.9,
    "reasoning": "Next.js app with custom Express server (common pattern)",
    "architecture": "fullstack_nextjs"
}

# Final Result: 90% confidence Next.js app
```

## 🚀 **Implementation Benefits**

### **Your Approach Advantages:**
1. **File Reading**: Direct access to actual code patterns
2. **Package Analysis**: Most reliable detection method  
3. **LLM Enhancement**: Handles edge cases intelligently
4. **Cost Effective**: LLM only when needed (saves API costs)
5. **High Accuracy**: Combines best of rule-based + AI

### **Expected Results:**
- **Speed**: 3-5 seconds for rule-based, +10 seconds for LLM
- **Accuracy**: 85-90% rule-based, 95-98% with LLM
- **Cost**: $0.01-0.05 per analysis (LLM when used)
- **Reliability**: Fallback to rule-based if LLM fails

---

## ✅ **Ready to Build?**

This approach gives you exactly what you wanted:
1. **Read repository files** ✓
2. **Analyze package.json, requirements.txt** ✓  
3. **Feed key files to LLM** ✓
4. **Get most accurate results** ✓

**Should we start implementing the Stack Analyzer with this strategy?**
