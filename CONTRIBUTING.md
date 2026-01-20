# Contributing to OnlineAccess

Thank you for considering contributing to the OnlineAccess project! This document provides guidelines and instructions for contributing.

## Getting Started

1. **Fork the repository** and clone your fork
2. **Install dependencies**: `npm install`
3. **Create a branch**: `git checkout -b feature/your-feature-name`
4. **Make your changes** following our coding standards
5. **Test your changes** thoroughly
6. **Commit your changes** with clear commit messages
7. **Push to your fork** and create a pull request

## Development Workflow

### Running the Application

```bash
# Development server
npm run dev

# Production build
npm run build
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

### Code Style

We follow these coding standards:

#### TypeScript
- Use TypeScript for all new code
- Define interfaces for all data structures
- Avoid `any` type when possible
- Use strict type checking

#### React Components
- Use functional components with hooks
- Server components by default, client components when needed
- Keep components small and focused
- Use meaningful component names

#### File Naming
- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utils: `camelCase.ts`
- Types: `index.ts` or descriptive names

#### Code Organization
```typescript
// 1. Imports (grouped logically)
import { useState } from 'react';
import type { MyType } from '@/types';
import { myUtil } from '@/lib/utils';

// 2. Types/Interfaces
interface ComponentProps {
  name: string;
}

// 3. Component
export const MyComponent = ({ name }: ComponentProps) => {
  // 4. Hooks
  const [state, setState] = useState();
  
  // 5. Functions
  const handleClick = () => {
    // ...
  };
  
  // 6. Effects
  useEffect(() => {
    // ...
  }, []);
  
  // 7. Return
  return <div>{name}</div>;
};
```

### Commit Messages

Follow conventional commit format:

```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(rms): add data version support
fix(api): handle network timeout errors
docs(readme): update installation instructions
```

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Ensure all tests pass**
4. **Update the CHANGELOG** if applicable
5. **Request review** from maintainers

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How to test these changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
```

## Testing Guidelines

### Unit Tests
- Test individual functions and utilities
- Use Jest for unit testing
- Aim for 80%+ code coverage

### Integration Tests
- Test component interactions
- Use React Testing Library
- Test user flows

### E2E Tests
- Test critical paths
- Use Playwright
- Test in multiple browsers

## Issue Reporting

### Bug Reports

Include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, browser, Node version)
- Screenshots if applicable

### Feature Requests

Include:
- Clear use case
- Proposed solution
- Alternative solutions considered
- Impact on existing functionality

## Code Review Process

All submissions require review. We look for:
- Code quality and clarity
- Adherence to standards
- Test coverage
- Documentation
- Performance implications

## Questions?

Feel free to:
- Open an issue for questions
- Ask in pull request comments
- Contact the maintainers

Thank you for contributing! 🎉
