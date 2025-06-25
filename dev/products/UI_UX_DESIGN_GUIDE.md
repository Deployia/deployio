# DeployIO Project Creation - UI/UX Design Guide

## Design Philosophy

DeployIO's project creation flow emphasizes **intelligence, clarity, and confidence** - guiding users through complex deployment configuration with AI assistance while maintaining full transparency and control.

## Visual Design Language

### Color Palette

```css
/* Primary Brand Colors */
--primary-blue: #2563eb;
--primary-blue-light: #60a5fa;
--primary-blue-dark: #1d4ed8;

/* Semantic Colors */
--success-green: #10b981;
--warning-amber: #f59e0b;
--error-red: #ef4444;
--info-cyan: #06b6d4;

/* AI/Intelligence Colors */
--ai-purple: #8b5cf6;
--ai-purple-light: #a78bfa;
--confidence-high: #10b981;
--confidence-medium: #f59e0b;
--confidence-low: #ef4444;

/* Neutral Grays */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-400: #9ca3af;
--gray-500: #6b7280;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;
```

### Typography

```css
/* Font Families */
--font-display: "Inter", sans-serif; /* Headers, UI elements */
--font-body: "Inter", sans-serif; /* Body text */
--font-mono: "JetBrains Mono", monospace; /* Code, technical details */

/* Font Sizes */
--text-xs: 0.75rem; /* 12px - Labels, captions */
--text-sm: 0.875rem; /* 14px - Form inputs, secondary text */
--text-base: 1rem; /* 16px - Body text */
--text-lg: 1.125rem; /* 18px - Section headers */
--text-xl: 1.25rem; /* 20px - Card titles */
--text-2xl: 1.5rem; /* 24px - Page headers */
--text-3xl: 1.875rem; /* 30px - Hero text */
```

## Component Design Patterns

### 1. Wizard Progress Indicator

```jsx
// Design Pattern: Horizontal Step Indicator with AI Confidence
const WizardProgress = ({
  steps,
  currentStep,
  completedSteps,
  aiConfidence,
}) => (
  <div className="flex items-center justify-between w-full max-w-4xl mx-auto mb-8">
    {steps.map((step, index) => (
      <div key={index} className="flex items-center">
        {/* Step Circle */}
        <div
          className={`
          relative flex items-center justify-center w-10 h-10 rounded-full
          ${
            index < currentStep
              ? "bg-success-green text-white"
              : index === currentStep
              ? "bg-primary-blue text-white"
              : "bg-gray-200 text-gray-500"
          }
        `}
        >
          {index < currentStep ? (
            <FaCheckCircle className="w-5 h-5" />
          ) : (
            <span className="text-sm font-medium">{index + 1}</span>
          )}

          {/* AI Confidence Indicator */}
          {step.aiEnhanced && aiConfidence && (
            <div
              className={`
              absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white
              ${
                aiConfidence > 0.8
                  ? "bg-confidence-high"
                  : aiConfidence > 0.6
                  ? "bg-confidence-medium"
                  : "bg-confidence-low"
              }
            `}
            />
          )}
        </div>

        {/* Step Label */}
        <div className="ml-3 text-sm">
          <p
            className={`font-medium ${
              index <= currentStep ? "text-gray-900" : "text-gray-500"
            }`}
          >
            {step.title}
          </p>
          {step.subtitle && (
            <p className="text-gray-400 text-xs">{step.subtitle}</p>
          )}
        </div>

        {/* Connector Line */}
        {index < steps.length - 1 && (
          <div
            className={`
            w-16 h-0.5 mx-4
            ${index < currentStep ? "bg-success-green" : "bg-gray-200"}
          `}
          />
        )}
      </div>
    ))}
  </div>
);
```

### 2. AI-Enhanced Form Field

```jsx
// Design Pattern: Form Field with AI Suggestions
const AIFormField = ({
  label,
  value,
  onChange,
  aiSuggestion,
  confidence,
  reasoning,
  type = "text",
}) => (
  <div className="space-y-2">
    {/* Field Label with AI Indicator */}
    <div className="flex items-center justify-between">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {aiSuggestion && (
        <div className="flex items-center space-x-1">
          <FaBrain className="w-3 h-3 text-ai-purple" />
          <span className="text-xs text-ai-purple font-medium">
            AI Suggested
          </span>
          <div
            className={`
            w-2 h-2 rounded-full
            ${
              confidence > 0.8
                ? "bg-confidence-high"
                : confidence > 0.6
                ? "bg-confidence-medium"
                : "bg-confidence-low"
            }
          `}
          />
        </div>
      )}
    </div>

    {/* Input Field */}
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md
          focus:ring-2 focus:ring-primary-blue focus:border-transparent
          ${aiSuggestion && !value ? "border-ai-purple bg-ai-purple/5" : ""}
        `}
        placeholder={aiSuggestion || ""}
      />

      {/* AI Suggestion Accept Button */}
      {aiSuggestion && !value && (
        <button
          onClick={() => onChange(aiSuggestion)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2
                   px-2 py-1 text-xs bg-ai-purple text-white rounded
                   hover:bg-ai-purple-light transition-colors"
        >
          Accept
        </button>
      )}
    </div>

    {/* AI Reasoning Tooltip */}
    {reasoning && (
      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
        <strong>AI Reasoning:</strong> {reasoning}
      </div>
    )}
  </div>
);
```

### 3. Repository Selection Card

```jsx
// Design Pattern: Repository Card with Metadata
const RepositoryCard = ({ repository, isSelected, onSelect }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`
      p-4 border rounded-lg cursor-pointer transition-all duration-200
      ${
        isSelected
          ? "border-primary-blue bg-primary-blue/5 shadow-md"
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
      }
    `}
    onClick={() => onSelect(repository)}
  >
    {/* Repository Header */}
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center space-x-2">
        <FaCodeBranch className="w-4 h-4 text-gray-500" />
        <h3 className="font-medium text-gray-900 truncate">
          {repository.name}
        </h3>
        {repository.private && (
          <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
            Private
          </span>
        )}
      </div>
      {isSelected && (
        <FaCheckCircle className="w-5 h-5 text-primary-blue flex-shrink-0" />
      )}
    </div>

    {/* Repository Description */}
    {repository.description && (
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {repository.description}
      </p>
    )}

    {/* Repository Metadata */}
    <div className="flex items-center justify-between text-xs text-gray-500">
      <div className="flex items-center space-x-4">
        {repository.language && (
          <div className="flex items-center space-x-1">
            <div
              className={`w-2 h-2 rounded-full ${getLanguageColor(
                repository.language
              )}`}
            />
            <span>{repository.language}</span>
          </div>
        )}
        {repository.stargazers_count > 0 && (
          <div className="flex items-center space-x-1">
            <FaStar className="w-3 h-3" />
            <span>{repository.stargazers_count}</span>
          </div>
        )}
      </div>
      <span>Updated {formatDate(repository.updated_at)}</span>
    </div>
  </motion.div>
);
```

### 4. Analysis Progress Animation

```jsx
// Design Pattern: Real-time Progress with Visual Feedback
const AnalysisProgress = ({ progress, currentStep, steps }) => (
  <div className="max-w-md mx-auto">
    {/* Main Progress Circle */}
    <div className="relative w-32 h-32 mx-auto mb-6">
      <svg className="w-32 h-32 transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx="64"
          cy="64"
          r="56"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        {/* Progress Circle */}
        <circle
          cx="64"
          cy="64"
          r="56"
          fill="none"
          stroke="#2563eb"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 56}`}
          strokeDashoffset={`${
            2 * Math.PI * 56 * (1 - progress.percentage / 100)
          }`}
          className="transition-all duration-500 ease-in-out"
        />
      </svg>

      {/* Center Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-blue">
            {Math.round(progress.percentage)}%
          </div>
          <div className="text-xs text-gray-500">Complete</div>
        </div>
      </div>
    </div>

    {/* Current Step Indicator */}
    <div className="text-center mb-6">
      <div className="flex items-center justify-center space-x-2 mb-2">
        {React.createElement(steps[currentStep]?.icon || FaSpinner, {
          className: `w-4 h-4 text-primary-blue ${
            progress.status === "running" ? "animate-spin" : ""
          }`,
        })}
        <h3 className="font-medium text-gray-900">
          {progress.stepName || steps[currentStep]?.label}
        </h3>
      </div>
      <p className="text-sm text-gray-600">
        {progress.message || steps[currentStep]?.description}
      </p>
    </div>

    {/* Step List */}
    <div className="space-y-2">
      {steps.map((step, index) => (
        <div
          key={index}
          className={`
          flex items-center space-x-3 p-2 rounded transition-colors
          ${
            index < currentStep
              ? "text-success-green"
              : index === currentStep
              ? "text-primary-blue bg-primary-blue/5"
              : "text-gray-400"
          }
        `}
        >
          {React.createElement(
            index < currentStep ? FaCheckCircle : step.icon,
            { className: "w-4 h-4 flex-shrink-0" }
          )}
          <span className="text-sm">{step.label}</span>
        </div>
      ))}
    </div>
  </div>
);
```

## Layout Patterns

### 1. Wizard Container Layout

```css
/* Main wizard container with consistent spacing and max-width */
.wizard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  min-height: calc(100vh - 4rem);
  display: flex;
  flex-direction: column;
}

.wizard-header {
  margin-bottom: 2rem;
  text-align: center;
}

.wizard-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.wizard-navigation {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--gray-200);
  display: flex;
  justify-content: between;
}
```

### 2. Responsive Grid Layouts

```css
/* Repository grid - responsive columns */
.repository-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  margin-bottom: 2rem;
}

/* Form grid - two column layout for wider screens */
.form-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
  }

  .form-grid .full-width {
    grid-column: 1 / -1;
  }
}
```

## Animation Guidelines

### 1. Page Transitions

```css
/* Smooth step transitions */
.wizard-step-enter {
  opacity: 0;
  transform: translateX(20px);
}

.wizard-step-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: all 300ms ease-in-out;
}

.wizard-step-exit {
  opacity: 1;
  transform: translateX(0);
}

.wizard-step-exit-active {
  opacity: 0;
  transform: translateX(-20px);
  transition: all 300ms ease-in-out;
}
```

### 2. Loading States

```css
/* Skeleton loading for repository cards */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
```

## Accessibility Features

### 1. Keyboard Navigation

- Tab order follows logical flow through wizard steps
- Enter key advances wizard or submits forms
- Escape key cancels operations or closes modals
- Arrow keys navigate between repository cards

### 2. Screen Reader Support

- Proper ARIA labels for all interactive elements
- Live regions for progress updates and status messages
- Descriptive alt text for icons and visual indicators
- Semantic HTML structure with proper headings

### 3. Color Accessibility

- All color combinations meet WCAG AA contrast requirements
- Information never conveyed through color alone
- High contrast mode support
- Color blind friendly palette choices

## Mobile Responsiveness

### 1. Touch-Friendly Design

- Minimum 44px touch targets
- Adequate spacing between interactive elements
- Swipe gestures for navigation where appropriate
- Mobile-optimized form inputs

### 2. Responsive Breakpoints

```css
/* Mobile First Approach */
/* Base: 320px+ (mobile) */
/* sm: 640px+ (large mobile) */
/* md: 768px+ (tablet) */
/* lg: 1024px+ (laptop) */
/* xl: 1280px+ (desktop) */
```

## Error State Design

### 1. Inline Validation

- Real-time field validation with clear error messages
- Success states to confirm correct input
- Warning states for potential issues
- Context-aware help text

### 2. Error Recovery

- Clear error messages with actionable solutions
- Retry mechanisms for failed operations
- Graceful degradation when AI services unavailable
- Manual fallback options for all automated features

This UI/UX guide ensures a consistent, accessible, and delightful user experience throughout the project creation flow.
