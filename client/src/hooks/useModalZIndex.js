import { useEffect } from 'react';

// Z-index constants for consistent layering across the application
export const Z_INDEX = {
  NAVBAR: 9997,
  NAVBAR_DROPDOWN: 9998,
  SIDEBAR: 9996,
  MODAL_BACKDROP: 10000,
  MODAL: 10001,
  TOAST: 10002,
  TOOLTIP: 10003
};

/**
 * Hook to inject global modal styles and ensure proper z-index layering
 * Should be used in main layout components
 */
export const useModalZIndexFix = () => {
  useEffect(() => {
    const styleId = 'global-modal-z-index-fix';
    const existingStyle = document.getElementById(styleId);
    
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* Global modal z-index fixes */
        
        /* Modal backdrop should be above navbar and sidebar */
        .modal-backdrop,
        .fixed.inset-0[role="dialog"],
        .fixed.inset-0.bg-black\\/50,
        .fixed.inset-0.bg-gray-900\\/50 {
          z-index: ${Z_INDEX.MODAL_BACKDROP} !important;
        }
        
        /* Modal content should be above backdrop */
        .modal-content,
        .modal-backdrop > div,
        .fixed.inset-0 > div.bg-white,
        .fixed.inset-0 > div.rounded-2xl,
        .fixed.inset-0 > div.rounded-xl,
        .fixed.inset-0 > div.shadow-lg {
          z-index: ${Z_INDEX.MODAL} !important;
        }

        /* Common modal patterns */
        .fixed.inset-0.flex.items-center.justify-center {
          z-index: ${Z_INDEX.MODAL_BACKDROP} !important;
        }

        .fixed.inset-0.flex.items-center.justify-center > div {
          z-index: ${Z_INDEX.MODAL} !important;
        }

        /* Ensure dropdowns are properly layered */
        .dropdown-menu,
        .select-dropdown,
        .popover {
          z-index: ${Z_INDEX.NAVBAR_DROPDOWN} !important;
        }

        /* Toast notifications at the top */
        .toast,
        .notification,
        .alert-toast {
          z-index: ${Z_INDEX.TOAST} !important;
        }

        /* Tooltips above everything */
        .tooltip,
        .tooltip-content {
          z-index: ${Z_INDEX.TOOLTIP} !important;
        }

        /* Specific fixes for common modal libraries */
        [data-radix-portal],
        [data-react-modal-overlay],
        .react-modal-overlay,
        .modal-overlay {
          z-index: ${Z_INDEX.MODAL_BACKDROP} !important;
        }

        /* Prevent body scroll when modal is open */
        body.modal-open {
          overflow: hidden !important;
        }

        /* Ensure sidebar doesn't interfere with modals */
        .sidebar {
          z-index: ${Z_INDEX.SIDEBAR} !important;
        }

        /* Fix for any z-[999] or similar low z-index modals */
        .fixed[class*="z-[999]"],
        .fixed[class*="z-50"],
        .fixed[class*="z-40"] {
          z-index: ${Z_INDEX.MODAL_BACKDROP} !important;
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      const styleElement = document.getElementById(styleId);
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);
};

/**
 * Utility function to get the correct z-index for a component
 */
export const getZIndex = (component) => {
  return Z_INDEX[component.toUpperCase()] || Z_INDEX.MODAL;
};

/**
 * Hook to manage body scroll when modals are open
 */
export const useModalBodyScroll = (isOpen) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);
};

export default {
  useModalZIndexFix,
  useModalBodyScroll,
  getZIndex,
  Z_INDEX
};