import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  // Function to safely handle different types of content
  const safeContent = (content: any): string => {
    if (content === null || content === undefined) {
      return '';
    }
    if (typeof content === 'string') {
      return content;
    }
    if (typeof content === 'number') {
      return content.toString();
    }
    if (typeof content === 'object') {
      try {
        return JSON.stringify(content);
      } catch {
        return 'Error: Could not display content';
      }
    }
    return String(content);
  };

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{safeContent(title)}</ToastTitle>}
              {description && typeof description === 'string' && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action && typeof action === 'function' && action({})}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
