import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** "fullscreen" (app backstop) or "page" (card-sized, keeps the nav around it). */
  variant?: "fullscreen" | "page";
  label?: string;
  /** When any value here changes (e.g. the route path), the error clears itself. */
  resetKeys?: unknown[];
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** True when the error is a stale tab failing to load a code chunk that a
 *  newer deployment replaced. The cure is a reload, not a bug report. */
function isStaleChunkError(error: Error): boolean {
  const msg = `${error?.message || ""} ${error?.name || ""}`;
  return /dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk|error loading dynamically imported/i.test(msg);
}

const RELOADED_ONCE_KEY = "chunk-error-reloaded";

function keysChanged(a?: unknown[], b?: unknown[]): boolean {
  if (!a || !b || a.length !== b.length) return true;
  return a.some((v, i) => v !== b[i]);
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // A stale tab that failed to load a chunk from a newer deployment heals
    // itself with one reload. Guarded to a single attempt per session so a
    // genuinely broken deployment cannot cause a reload loop.
    if (isStaleChunkError(error) && !sessionStorage.getItem(RELOADED_ONCE_KEY)) {
      sessionStorage.setItem(RELOADED_ONCE_KEY, "1");
      window.location.reload();
    }
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Unhandled error:", error, errorInfo.componentStack);
  }

  componentDidUpdate(prev: ErrorBoundaryProps) {
    // Recover automatically when the caller's reset keys change, e.g. the user
    // navigates to another route after one page hit a render error.
    if (this.state.error && keysChanged(prev.resetKeys, this.props.resetKeys)) {
      this.setState({ error: null });
    }
  }

  resetError = () => this.setState({ error: null });

  goHome = () => {
    this.setState({ error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.error) {
      if (isStaleChunkError(this.state.error)) {
        return (
          <div className="container py-12">
            <div className="max-w-md mx-auto text-center space-y-4 rounded-lg border p-8">
              <AlertTriangle className="h-9 w-9 text-muted-foreground mx-auto" aria-hidden="true" />
              <h2 className="text-lg font-semibold">A new version of the app is ready</h2>
              <p className="text-sm text-muted-foreground">
                This tab was still running the previous version. Refresh to load the new one. Your
                saved work is untouched.
              </p>
              <Button onClick={() => window.location.reload()}>Refresh now</Button>
            </div>
          </div>
        );
      }
      if (this.props.variant === "page") {
        return (
          <div className="container py-12">
            <div className="max-w-md mx-auto text-center space-y-4 rounded-lg border p-8">
              <AlertTriangle className="h-9 w-9 text-destructive mx-auto" aria-hidden="true" />
              <h2 className="text-lg font-semibold">{this.props.label || "This page hit a display error"}</h2>
              <p className="text-sm text-muted-foreground">
                Your data is safe. This is a display error, not data loss. Try again, or move to another
                section using the menu.
              </p>
              <div className="flex justify-center gap-2">
                <Button onClick={this.resetError}>Try again</Button>
                <Button variant="outline" onClick={this.goHome}>Back to Dashboard</Button>
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto" aria-hidden="true" />
            <h1 className="text-xl font-semibold">This page hit a display error. Refresh to continue.</h1>
            <p className="text-sm text-muted-foreground">
              Your data is safe. This is a display error, not data loss. Try again, or return to the
              dashboard. If it keeps happening, note what you were doing and report it.
            </p>
            <div className="flex justify-center gap-2">
              <Button onClick={this.resetError}>Try again</Button>
              <Button variant="outline" onClick={this.goHome}>Back to Dashboard</Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
