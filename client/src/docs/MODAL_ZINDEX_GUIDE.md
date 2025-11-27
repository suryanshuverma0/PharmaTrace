# Modal Z-Index Management Guide

## Overview
This document explains how to handle modal z-index issues in the PharmaTrace application to ensure modals appear above navigation bars and other UI elements.

## Z-Index Hierarchy

```javascript
const Z_INDEX = {
  NAVBAR: 9997,           // Main navigation bar
  NAVBAR_DROPDOWN: 9998,  // Dropdown menus in navbar
  SIDEBAR: 9996,          // Side navigation
  MODAL_BACKDROP: 10000,  // Modal background overlay
  MODAL: 10001,           // Modal content
  TOAST: 10002,           // Toast notifications
  TOOLTIP: 10003          // Tooltips
};
```

## Usage

### 1. Using ModalWrapper (Recommended)

```jsx
import ModalWrapper from '../../components/common/ModalWrapper';

const MyComponent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>Open Modal</button>
      
      <ModalWrapper
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="md"
        title="My Modal Title"
      >
        <div>Modal content goes here</div>
      </ModalWrapper>
    </>
  );
};
```

### 2. Custom Modal Implementation

If you need to create a custom modal, ensure proper z-index:

```jsx
import { Z_INDEX, useModalBodyScroll } from '../../hooks/useModalZIndex';

const CustomModal = ({ isOpen, onClose, children }) => {
  useModalBodyScroll(isOpen); // Prevents body scroll when modal is open

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/50 modal-backdrop"
      style={{ zIndex: Z_INDEX.MODAL_BACKDROP }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl p-6 modal-content"
        style={{ zIndex: Z_INDEX.MODAL }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};
```

### 3. Layout Setup

Each main layout component should include the modal z-index fix:

```jsx
import { useModalZIndexFix } from '../hooks/useModalZIndex';

const MyLayout = () => {
  // Apply global modal z-index fixes
  useModalZIndexFix();

  return (
    <div className="layout">
      {/* Your layout content */}
    </div>
  );
};
```

## Auto-Applied CSS Classes

The following CSS classes are automatically applied when using the modal system:

- `.modal-backdrop` - Applied to modal background overlays
- `.modal-content` - Applied to modal content containers
- `.modal-open` - Applied to `<body>` when any modal is open (prevents scrolling)

## Common Issues and Solutions

### Modal appears behind navbar
- **Cause**: Modal z-index is lower than navbar (9997)
- **Solution**: Use `ModalWrapper` or set z-index to at least 10000

### Multiple modals stacking incorrectly
- **Cause**: All modals using the same z-index
- **Solution**: Use incremental z-index or modal queue system

### Body scroll not prevented
- **Cause**: Missing `useModalBodyScroll` hook
- **Solution**: Use `ModalWrapper` or call `useModalBodyScroll(isOpen)`

### Dropdown menus appearing above modals
- **Cause**: Dropdown z-index higher than modal
- **Solution**: Check dropdown z-index and ensure it's lower than modal

## Migration Guide

### Converting existing modals to use ModalWrapper:

**Before:**
```jsx
{showModal && (
  <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50">
    <div className="bg-white p-6 rounded-2xl">
      {/* Modal content */}
    </div>
  </div>
)}
```

**After:**
```jsx
<ModalWrapper
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  size="md"
>
  {/* Modal content */}
</ModalWrapper>
```

## Testing

To test modal z-index:
1. Open any modal
2. Ensure it appears above navbar/sidebar
3. Check that body scroll is prevented
4. Verify ESC key closes modal
5. Test backdrop click behavior

## Files Modified

- `hooks/useModalZIndex.js` - Z-index constants and utilities
- `components/common/ModalWrapper.jsx` - Reusable modal component
- `layout/*Layout.jsx` - All layout files now include modal fixes
- `pages/manufacturer/ProductsList.jsx` - Example implementation

For questions or issues, check the z-index hierarchy and ensure you're using the correct constants from `hooks/useModalZIndex.js`.