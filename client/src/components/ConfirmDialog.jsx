import { useEffect, useRef } from 'react';
export function ConfirmDialog({ children, onClose }) {
  const dialog = useRef(null);
  useEffect(() => { dialog.current.showModal(); }, []);
  return <dialog ref={dialog} onCancel={event => { event.preventDefault(); onClose(); }}>{children}</dialog>;
}
