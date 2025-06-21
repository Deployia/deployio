# Stack Analyzer Implementation Plan

## 🎯 **Objective**
Create a highly accurate (96%+) technology stack detection system that combines:
1. **File-based detection** (structure analysis)
2. **Package-based detection** (dependency files)
3. **LLM enhancement** (intelligent analysis)

## 🏗️ **Architecture Overview**

```
StackAnalyzer
├── 1. File Structure Analysis
│   ├── Directory patterns (src/, pages/, components/)
│   ├── File extensions (.js, .py, .java)
│   └── Special files (Dockerfile, Makefile)
├── 2. Package File Analysis  
│   ├── package.json (Node.js ecosystem)
│   ├── requirements.txt (Python ecosystem)
│   ├── pom.xml (Java/Maven ecosystem)
│   ├── Cargo.toml (Rust ecosystem)
│   └── composer.json (PHP ecosystem)
├── 3. Content Analysis
│   ├── Import statements
│   ├── Framework-specific patterns
│   └── Configuration patterns
└── 4. LLM Enhancement
    ├── Low confidence scenarios
    ├── Complex/ambiguous cases
    └── Cross-validation
```

## 📊 **Detection Strategy**

### **Phase 1: Rule-Based Detection (Speed + Reliability)**
- **Target Confidence**: 60-85%
- **Processing Time**: <5 seconds
- **Accuracy**: ~85-90%

### **Phase 2: LLM Enhancement (Accuracy Boost)**
- **Trigger**: When rule-based confidence < 80%
- **Target Confidence**: 85-98%
- **Processing Time**: +10-15 seconds
- **Accuracy**: ~95-98%

## 🔍 **Detailed Implementation Plan**

### **1. File Structure Analysis**

#### **1.1 Directory Pattern Detection**
```python
FRAMEWORK_PATTERNS = {
    "react": {
        "directories": ["src/", "public/", "components/", "pages/"],
        "files": ["package.json", "public/index.html"],
        "indicators": ["src/App.js", "src/index.js", "public/favicon.ico"]
    },
    "vue": {
        "directories": ["src/", "public/", "components/", "views/"],
        "files": ["package.json", "vue.config.js", "public/index.html"],
        "indicators": ["src/main.js", "src/App.vue"]
    },
    "django": {
        "directories": ["templates/", "static/", "migrations/"],
        "files": ["manage.py", "requirements.txt", "settings.py"],
        "indicators": ["*/settings.py", "*/urls.py", "*/wsgi.py"]
    },
    "flask": {
        "directories": ["templates/", "static/"],
        "files": ["app.py", "requirements.txt", "run.py"],
        "indicators": ["app.py", "*/app.py", "run.py"]
    }
}
```

#### **1.2 File Extension Analysis**
```python
LANGUAGE_EXTENSIONS = {
    "javascript": [".js", ".jsx", ".ts", ".tsx", ".mjs"],
    "python": [".py", ".pyw", ".pyi", ".pyx"],
    "java": [".java", ".jar", ".war"],
    "php": [".php", ".phtml", ".phar"],
    "go": [".go", ".mod"],
    "rust": [".rs", ".toml"],
    "ruby": [".rb", ".gem", ".gemspec"]
}
```

### **2. Package File Analysis (Most Accurate)**

#### **2.1 Node.js Ecosystem (package.json)**
```python
async def analyze_package_json(self, content: str) -> Dict:
    """
    Analyze package.json for comprehensive Node.js stack detection
    
    Detection Priority:
    1. Framework detection (dependencies)
    2. Build tools (devDependencies + scripts)
    3. Runtime version (engines)
    4. Package manager (lockfiles)
    """
    package_data = json.loads(content)
    
    # Framework Detection
    dependencies = {**package_data.get("dependencies", {}), 
                   **package_data.get("devDependencies", {})}
    
    frameworks = {
        "react": ["react", "react-dom", "next", "gatsby"],
        "vue": ["vue", "nuxt", "@vue/cli"],
        "angular": ["@angular/core", "@angular/cli"],
        "express": ["express", "fastify", "koa"],
        "nest": ["@nestjs/core", "@nestjs/common"]
    }
    
    detected_framework = None
    confidence = 0.0
    
    for framework, packages in frameworks.items():
        matches = sum(1 for pkg in packages if pkg in dependencies)
        if matches > 0:
            framework_confidence = matches / len(packages)
            if framework_confidence > confidence:
                confidence = framework_confidence
                detected_framework = framework
    
    # Build Tool Detection
    scripts = package_data.get("scripts", {})
    build_tools = {
        "vite": "vite" in dependencies or "vite build" in str(scripts),
        "webpack": "webpack" in dependencies or "@vue/cli-service" in dependencies,
        "parcel": "parcel" in dependencies,
        "rollup": "rollup" in dependencies
    }
    
    return {
        "language": "javascript",
        "framework": detected_framework,
        "build_tool": next((tool for tool, detected in build_tools.items() if detected), None),
        "package_manager": self._detect_package_manager(),
        "runtime_version": package_data.get("engines", {}).get("node"),
        "confidence": min(confidence + 0.2, 1.0),  # Boost for package.json analysis
        "additional_info": {
            "dependencies_count": len(dependencies),
            "has_typescript": "typescript" in dependencies,
            "has_testing": any(test in dependencies for test in ["jest", "mocha", "cypress", "vitest"])
        }
    }
```

#### **2.2 Python Ecosystem (requirements.txt, pyproject.toml)**
```python
async def analyze_python_dependencies(self, requirements_content: str) -> Dict:
    """
    Analyze Python dependencies for framework detection
    """
    lines = [line.strip() for line in requirements_content.split('\n') 
             if line.strip() and not line.startswith('#')]
    
    packages = []
    for line in lines:
        # Handle various formats: django==4.2.0, flask>=2.0, requests
        package_name = re.split(r'[><=!]', line)[0].strip()
        packages.append(package_name.lower())
    
    frameworks = {
        "django": ["django", "djangorestframework", "django-cors-headers"],
        "flask": ["flask", "flask-restful", "flask-sqlalchemy"],
        "fastapi": ["fastapi", "uvicorn", "starlette"],
        "tornado": ["tornado"],
        "pyramid": ["pyramid"]
    }
    
    detected_framework = None
    confidence = 0.0
    
    for framework, framework_packages in frameworks.items():
        matches = sum(1 for pkg in framework_packages if pkg in packages)
        if matches > 0:
            framework_confidence = matches / len(framework_packages)
            if framework_confidence > confidence:
                confidence = framework_confidence
                detected_framework = framework
    
    return {
        "language": "python",
        "framework": detected_framework,
        "confidence": min(confidence + 0.3, 1.0),  # High confidence for direct package detection
        "package_count": len(packages),
        "has_web_framework": detected_framework is not None,
        "has_database": any(db in packages for db in ["psycopg2", "pymongo", "sqlalchemy"]),
        "has_testing": any(test in packages for test in ["pytest", "unittest2", "nose"])
    }
```

### **3. Content Analysis (File Reading)**

#### **3.1 Key File Content Analysis**
```python
async def analyze_key_files(self, file_contents: Dict[str, str]) -> Dict:
    """
    Analyze content of key files for framework-specific patterns
    """
    analysis_results = {}
    
    for file_path, content in file_contents.items():
        file_analysis = {
            "file_path": file_path,
            "frameworks_detected": [],
            "imports_found": [],
            "patterns_matched": []
        }
        
        # JavaScript/TypeScript files
        if file_path.endswith(('.js', '.jsx', '.ts', '.tsx')):
            file_analysis.update(await self._analyze_js_content(content))
        
        # Python files
        elif file_path.endswith('.py'):
            file_analysis.update(await self._analyze_python_content(content))
        
        # Configuration files
        elif file_path in ['Dockerfile', 'docker-compose.yml', 'Makefile']:
            file_analysis.update(await self._analyze_config_content(content, file_path))
        
        analysis_results[file_path] = file_analysis
    
    return analysis_results

async def _analyze_js_content(self, content: str) -> Dict:
    """Analyze JavaScript/TypeScript content for framework patterns"""
    patterns = {
        "react": [
            r"import.*React.*from ['\"]react['\"]",
            r"import.*\{.*Component.*\}.*from ['\"]react['\"]",
            r"React\.createElement",
            r"\.jsx?$",
            r"useState|useEffect|useContext"
        ],
        "vue": [
            r"<template>.*</template>",
            r"import.*Vue.*from ['\"]vue['\"]",
            r"Vue\.component",
            r"\.vue$",
            r"defineComponent|ref|reactive"
        ],
        "express": [
            r"const express = require\(['\"]express['\"]\)",
            r"import express from ['\"]express['\"]",
            r"app\.get\(|app\.post\(|app\.use\(",
            r"app\.listen\("
        ]
    }
    
    detected_frameworks = []
    matched_patterns = []
    
    for framework, framework_patterns in patterns.items():
        matches = 0
        for pattern in framework_patterns:
            if re.search(pattern, content, re.IGNORECASE | re.MULTILINE):
                matches += 1
                matched_patterns.append(f"{framework}: {pattern}")
        
        if matches > 0:
            confidence = matches / len(framework_patterns)
            detected_frameworks.append({
                "framework": framework,
                "confidence": confidence,
                "matches": matches
            })
    
    return {
        "frameworks_detected": detected_frameworks,
        "patterns_matched": matched_patterns
    }
```

### **4. LLM Enhancement Strategy**

#### **4.1 When to Use LLM**
```python
def should_use_llm(self, rule_based_result: Dict) -> bool:
    """
    Determine if LLM enhancement is needed
    
    Use LLM when:
    1. Rule-based confidence < 80%
    2. Conflicting framework detection
    3. Unknown/complex project structure
    4. Multiple possible frameworks detected
    """
    confidence = rule_based_result.get("confidence", 0.0)
    detected_frameworks = rule_based_result.get("possible_frameworks", [])
    
    return (
        confidence < 0.80 or  # Low confidence
        len(detected_frameworks) > 1 or  # Multiple possibilities
        rule_based_result.get("framework") == "unknown"  # Unknown framework
    )
```

#### **4.2 LLM Prompt Strategy**
```python
def create_llm_prompt(self, file_structure: List[str], package_files: Dict[str, str], 
                     key_file_contents: Dict[str, str], rule_based_result: Dict) -> str:
    """
    Create intelligent prompt for LLM analysis
    """
    prompt = f"""
You are an expert software architect. Analyze this repository to determine the technology stack.

RULE-BASED ANALYSIS RESULT:
{json.dumps(rule_based_result, indent=2)}

REPOSITORY STRUCTURE (first 30 files):
{json.dumps(file_structure[:30], indent=2)}

PACKAGE FILES:
{json.dumps({k: v[:1000] for k, v in package_files.items()}, indent=2)}

KEY FILE CONTENTS (truncated):
{json.dumps({k: v[:500] + "..." if len(v) > 500 else v for k, v in key_file_contents.items()}, indent=2)}

Based on this information, provide your analysis in this EXACT JSON format:
{{
    "confidence": 0.95,
    "primary_language": "javascript",
    "framework": "react",
    "database": "mongodb",
    "build_tool": "vite",
    "package_manager": "npm",
    "architecture_pattern": "spa",
    "reasoning": "Clear React application with Vite build tool...",
    "additional_technologies": ["typescript", "tailwindcss"],
    "deployment_strategy": "static_hosting"
}}

Focus on:
1. Validating rule-based detection
2. Resolving conflicts between different indicators
3. Identifying missed technologies
4. Providing confidence score (0-1)
"""
    return prompt
```

### **5. Combining Results (Smart Fusion)**

#### **5.1 Weighted Confidence Calculation**
```python
def calculate_final_confidence(self, 
                             file_structure_result: Dict,
                             package_analysis_result: Dict, 
                             content_analysis_result: Dict,
                             llm_result: Optional[Dict] = None) -> float:
    """
    Calculate weighted final confidence score
    
    Weights:
    - Package files: 50% (most reliable)
    - File content: 30% (very reliable)
    - File structure: 20% (less reliable)
    - LLM boost: +10% (when used)
    """
    
    weights = {
        "package": 0.50,
        "content": 0.30, 
        "structure": 0.20
    }
    
    confidences = [
        package_analysis_result.get("confidence", 0.0),
        content_analysis_result.get("confidence", 0.0),
        file_structure_result.get("confidence", 0.0)
    ]
    
    weighted_confidence = sum(c * w for c, w in zip(confidences, weights.values()))
    
    # LLM boost
    if llm_result and llm_result.get("confidence", 0.0) > weighted_confidence:
        llm_boost = min(0.10, llm_result["confidence"] - weighted_confidence)
        weighted_confidence += llm_boost
    
    return min(weighted_confidence, 1.0)
```

## 🎯 **Expected Accuracy by Detection Method**

| Method | Accuracy | Speed | Cost |
|--------|----------|-------|------|
| File Structure Only | ~75% | Very Fast | Free |
| + Package Analysis | ~90% | Fast | Free |
| + Content Analysis | ~93% | Medium | Free |
| + LLM Enhancement | ~96% | Slower | Low Cost |

## 📝 **Implementation Priority**

### **Week 1: Core Implementation**
1. **Day 1-2**: File structure analysis + Package analysis
2. **Day 3-4**: Content analysis + Pattern matching
3. **Day 5**: Result combination logic

### **Week 2: Enhancement**
1. **Day 1-2**: LLM integration
2. **Day 3-4**: Testing + Accuracy validation
3. **Day 5**: Performance optimization

## 🧪 **Testing Strategy**

### **Test Cases**
1. **Popular Frameworks**: React, Vue, Django, Flask, Express
2. **Edge Cases**: Monorepos, microservices, hybrid apps
3. **Ambiguous Cases**: Plain HTML, custom frameworks
4. **Complex Cases**: Full-stack apps, multiple frameworks

### **Accuracy Validation**
- Test against 100+ open source repositories
- Compare with manual analysis
- Measure confidence vs actual accuracy
- Optimize thresholds based on results

---

## ❓ **Ready to Implement?**

This plan gives us:
- ✅ **High Accuracy** (96%+ target)
- ✅ **Fast Performance** (rule-based first)
- ✅ **Cost Effective** (smart LLM usage)
- ✅ **Maintainable** (clear separation)

**Should we start implementing the Stack Analyzer with this approach?**
