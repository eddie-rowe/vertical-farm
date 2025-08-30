Comprehensive testing workflow for features actively in development using specialized testing agents:

[Extended thinking: This workflow orchestrates multiple testing agents to validate features during active development. It focuses on real-world scenarios, user acceptance validation, and integration testing with the service layer and database.]

## Phase 1: Feature Validation Testing

### 1. UI/UX Feature Testing
- Use Task tool with subagent_type="playwright-tester"
- Prompt: "Create Playwright tests for the feature currently in development: $ARGUMENTS. Focus on user acceptance criteria, service layer integration, and real database data scenarios. Test the complete user journey and validate the feature works with actual Supabase data."
- Output: Feature-specific test suites, user story validation, regression prevention tests

### 2. Backend Integration Testing  
- Use Task tool with subagent_type="test-automator"
- Prompt: "Create backend integration tests for: $ARGUMENTS. Focus on API endpoints, service layer functionality, database operations, and error handling. Ensure proper integration between frontend services and backend APIs."
- Output: API tests, service layer tests, database integration tests

## Phase 2: Comprehensive Quality Assurance

### 3. Code Quality Review
- Use Task tool with subagent_type="code-reviewer"
- Prompt: "Review all code changes for the feature: $ARGUMENTS. Focus on service layer patterns, proper use of singleton getInstance() methods, error handling, and adherence to Next.js 15 and React 19 patterns."
- Output: Code quality report, architectural compliance validation

### 4. Performance Impact Testing
- Use Task tool with subagent_type="performance-engineer"
- Prompt: "Analyze performance impact of the new feature: $ARGUMENTS. Test loading times, service layer efficiency, database query performance, and ensure the feature doesn't degrade existing functionality."
- Output: Performance metrics, optimization recommendations, regression analysis

## Phase 3: Security and Accessibility Validation

### 5. Security Validation
- Use Task tool with subagent_type="security-auditor"
- Prompt: "Audit security aspects of the feature: $ARGUMENTS. Verify RLS policies are correctly implemented, authentication flows are secure, and no sensitive data is exposed to the frontend."
- Output: Security assessment, RLS policy validation, vulnerability report

### 6. Accessibility Testing (if UI components)
- Use Task tool with subagent_type="ui-ux-designer"
- Prompt: "Validate accessibility compliance for UI components in: $ARGUMENTS. Check WCAG compliance, keyboard navigation, screen reader compatibility, and inclusive design patterns."
- Output: Accessibility audit, compliance report, improvement recommendations

## Phase 4: Data Integration and Edge Cases

### 7. Database Integration Testing
- Use Task tool with subagent_type="database-optimizer"
- Prompt: "Validate database interactions for: $ARGUMENTS. Test with real Supabase data, verify RLS policies work correctly, check query performance, and validate data consistency."
- Output: Database integration report, RLS validation, query optimization recommendations

### 8. Error Handling and Edge Cases
- Use Task tool with subagent_type="debugger"
- Prompt: "Test error scenarios and edge cases for: $ARGUMENTS. Validate proper error handling in the service layer, graceful degradation in UI, and appropriate error messages for users."
- Output: Error scenario test results, edge case validation, user experience assessment

## Development-Focused Testing Priorities

1. **Real Data Integration** - Test with actual database records, not mocks
2. **Service Layer Validation** - Ensure proper use of singleton service patterns  
3. **User Acceptance Focus** - Each test validates acceptance criteria
4. **Regression Prevention** - Ensure new features don't break existing functionality
5. **Progressive Enhancement** - Start with happy path, expand to edge cases
6. **Immediate Feedback** - Provide rapid validation during development cycles

## Coordination Notes
- All testing agents work with the actual feature codebase
- Tests use real Supabase connections and service layer integration
- Focus on user-centric validation over implementation testing
- Maintain test suites that can run during active development
- Each agent builds upon findings from previous testing phases

Feature to test: $ARGUMENTS