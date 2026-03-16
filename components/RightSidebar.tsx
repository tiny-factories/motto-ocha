export function RightSidebar() {
  return (
    <aside className="fixed right-0 top-0 z-10 hidden h-screen w-64 flex-col border-l border-card-border bg-background md:flex">
      <div className="flex-1" />
      {/* Small ad card at bottom */}
      <div className="shrink-0 border-t border-card-border p-3">
        <div className="flex min-h-[80px] items-center justify-center rounded-lg border border-dashed border-card-border bg-warm-highlight/50">
          <span className="text-xs text-muted-foreground">Ad</span>
        </div>
      </div>
    </aside>
  );
}
