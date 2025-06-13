# ESLint Import Order Configuration

This document explains the ESLint import order rules configured for the Wildfire Smoke Tool project.

## Import Order Pattern

The ESLint configuration enforces the following import order:

### 1. React and Core Libraries (First)
```javascript
import React, { useState, useEffect } from 'react';
```

### 2. Third-party Libraries (Second)
```javascript
import { Map } from 'react-map-gl';
import { Clock, CheckCircle } from 'lucide-react';
import { someFunction } from '@some-package/library';
```

### 3. Internal Utilities and Constants (Third)
```javascript
import { TILESET_INFO } from '../../../utils/map/constants';
import { getCurrentTimelineHour } from '../../../utils/map/timeUtils';
import { PM25_LEVELS } from '../../constants/pm25Levels';
```

### 4. Components (Fourth)
```javascript
import ThemedPanel from './ThemedPanel';
import MapControls from './controls/MapControls';
```

### 5. Styles (Last)
```javascript
import './App.css';
import '../styles/component.css';
```

## ESLint Rule Configuration

The import order is enforced by the `import/order` rule with the following configuration:

- **Severity**: `error` (will fail linting)
- **Groups**: Organized into logical groups with proper spacing
- **Path Groups**: Special handling for React, common libraries, and internal paths
- **Alphabetization**: Imports within each group are sorted alphabetically
- **Newlines**: Always required between different import groups

## Usage

### Running ESLint

```bash
# Check for linting errors
npm run lint

# Automatically fix linting errors (including import order)
npm run lint:fix

# Format code and fix linting issues
npm run pre-commit
```

### VS Code Integration

To get real-time import order checking in VS Code:

1. Install the ESLint extension
2. Add to your VS Code settings.json:
```json
{
  "eslint.validate": ["javascript", "javascriptreact"],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Automatic Import Organization

The ESLint configuration will automatically:
- ✅ Sort imports into the correct groups
- ✅ Add proper spacing between groups
- ✅ Alphabetize imports within each group
- ✅ Remove duplicate imports
- ✅ Add newlines after import blocks

## Examples

### ✅ Correct Import Order
```javascript
import React, { useState, useEffect } from 'react';

import { Map } from 'react-map-gl';
import { Clock, CheckCircle } from 'lucide-react';

import { TILESET_INFO } from '../../../utils/map/constants';
import { getCurrentTimelineHour } from '../../../utils/map/timeUtils';

import ThemedPanel from './ThemedPanel';
import MapControls from './controls/MapControls';

import './Component.css';
```

### ❌ Incorrect Import Order (will be auto-fixed)
```javascript
import { Clock } from 'lucide-react';
import React from 'react';
import './Component.css';
import { TILESET_INFO } from '../../../utils/map/constants';
import ThemedPanel from './ThemedPanel';
```

## Path Group Patterns

The configuration includes specific patterns for:

- **React**: Always first in external group
- **Third-party libraries**: lucide-react, react-map-gl, mapbox-gl, @-scoped packages
- **Utils**: ../utils/**, ../../utils/**, ../../../utils/**
- **Constants**: ../constants/**, ../../constants/**, ../../../constants/**
- **Components**: ../components/**, ../../components/**
- **Styles**: ./**/*.css, ../**/*.css

## Benefits

1. **Consistency**: All files follow the same import pattern
2. **Readability**: Clear separation between different types of imports
3. **Maintainability**: Easier to understand dependencies at a glance
4. **Automation**: No manual sorting required - ESLint handles it
5. **Team Standards**: Enforced across all developers

## Troubleshooting

### Common Issues

1. **Import order errors**: Run `npm run lint:fix` to auto-fix
2. **Missing newlines**: The rule will add them automatically
3. **Duplicate imports**: ESLint will detect and remove duplicates

### Disabling Rules (Not Recommended)

If you need to disable the import order rule for a specific file:
```javascript
/* eslint-disable import/order */
// Your imports here
/* eslint-enable import/order */
```

## Integration with CI/CD

The import order rules are integrated into the project's scripts:
- `npm run lint` - Check for violations
- `npm run lint:fix` - Auto-fix violations
- `npm run pre-commit` - Run before commits
- `npm run predeploy` - Run before deployment

This ensures consistent import ordering across all environments and team members.
