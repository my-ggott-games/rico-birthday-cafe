import type { CSSProperties, DragEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

type CommonModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  overlayClassName?: string;
  panelClassName?: string;
  panelMaxWidthClassName?: string;
  panelStyle?: CSSProperties;
  iconWrapperStyle?: CSSProperties;
  titleClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
};

export const CommonModal = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
  overlayClassName = "",
  panelClassName = "",
  panelMaxWidthClassName = "max-w-sm",
  panelStyle,
  iconWrapperStyle,
  titleClassName = "",
  bodyClassName = "",
  footerClassName = "",
}: CommonModalProps) => {
  const preventDrag = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
  };

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className={`fixed inset-0 z-[999999] flex items-center justify-center p-4 select-none ${overlayClassName}`}
          draggable={false}
          onDragStart={preventDrag}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className={`relative z-10 w-full ${panelMaxWidthClassName} rounded-[2rem] border-4 border-[#5EC7A5] bg-[#FFFFF8] p-6 text-center shadow-2xl ${panelClassName}`}
            style={panelStyle}
            draggable={false}
            onClick={(event) => event.stopPropagation()}
          >
            {icon ? (
              <span
                className="mb-3 inline-flex shrink-0 self-start rounded-full bg-[#eefaf3] p-3 text-[#166D77] shadow-sm"
                style={iconWrapperStyle}
              >
                {icon}
              </span>
            ) : null}
            {title ? (
              <h3 className={`mb-6 text-xl font-black text-[#166D77] ${titleClassName}`}>
                {title}
              </h3>
            ) : null}
            {children ? <div className={bodyClassName}>{children}</div> : null}
            {footer ? <div className={footerClassName}>{footer}</div> : null}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
