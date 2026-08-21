import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useNotificationPrefs, NOTIFICATION_TYPES } from "@/hooks/useNotificationPrefs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sun, Moon, Monitor } from "lucide-react";
import { OrganizationPanel } from "@/components/OrganizationPanel";
import { useOrganization } from "@/hooks/useOrganization";

const ROLES = [
  { value: "teacher", label: "Teacher" },
  { value: "implementation_lead", label: "Implementation Lead" },
  { value: "admin_lead", label: "Admin Lead" },
  { value: "principal", label: "Principal/Head of School" },
  { value: "district_leader", label: "District / Network Admin" },
  { value: "data_manager", label: "Data Manager" },
  { value: "governor", label: "Board Member" },
  { value: "superadmin", label: "Super Admin" },
];

/** These two roles describe network-level access, not a school job. Only a
 *  network leader should be able to hand them out from their own profile. */
const NETWORK_ONLY_ROLE_VALUES = new Set(["district_leader", "superadmin"]);

export default function Settings() {
  const { isEnabled, missingTable: prefsMissingTable, setEnabled, isSaving, pendingType } = useNotificationPrefs();
  const { user, signOut } = useAuth();
  const { isNetworkLeader } = useOrganization();
  const roleOptions = ROLES.filter((r) => isNetworkLeader || !NETWORK_ONLY_ROLE_VALUES.has(r.value));
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setFullName(data.full_name || "");
        setRole(data.role || "");
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, role: role as any })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Could not save profile", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile saved" });
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setSendingReset(false);
    if (error) {
      toast({ title: "Could not send reset email", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Reset email sent", description: `Check ${user.email} for a password reset link.` });
    }
  };

  return (
    <div className="container max-w-2xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Your profile, appearance, and account</p>
      </div>

      <OrganizationPanel />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>How you appear to your implementation teams</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Theme for this device</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant={theme === "light" ? "default" : "outline"} onClick={() => setTheme("light")}>
              <Sun className="mr-2 h-4 w-4" /> Light
            </Button>
            <Button variant={theme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" /> Dark
            </Button>
            <Button variant={theme === "system" ? "default" : "outline"} onClick={() => setTheme("system")}>
              <Monitor className="mr-2 h-4 w-4" /> System
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Choose which alerts land in your bell. Everything is on by default; turning one off
            stops future alerts of that type without deleting anything already there.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {prefsMissingTable ? (
            <p className="text-sm text-muted-foreground">
              Notification preferences arrive with the next database update for this workspace.
            </p>
          ) : (
            NOTIFICATION_TYPES.map((t) => (
              <div key={t.type} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.detail}</p>
                </div>
                <Switch
                  checked={isEnabled(t.type)}
                  disabled={isSaving && pendingType === t.type}
                  onCheckedChange={(v) => setEnabled({ type: t.type, enabled: v })}
                  aria-label={t.label}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>{user?.email}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handlePasswordReset} disabled={sendingReset}>
            {sendingReset ? "Sending..." : "Send Password Reset Email"}
          </Button>
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
