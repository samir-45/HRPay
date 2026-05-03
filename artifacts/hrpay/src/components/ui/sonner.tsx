import { Toaster as Sonner, toast } from "sonner";

const Toaster = () => (
  <Sonner
    position="top-right"
    expand={false}
    richColors
    closeButton
    toastOptions={{
      duration: 4000,
      classNames: {
        toast: "!rounded-xl !shadow-lg !border !border-border !font-sans",
        title: "!font-semibold !text-sm",
        description: "!text-xs !text-muted-foreground",
        success: "!border-emerald-200",
        error: "!border-red-200",
        warning: "!border-amber-200",
        info: "!border-blue-200",
      },
    }}
  />
);

export { Toaster, toast };
