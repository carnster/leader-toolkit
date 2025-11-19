import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { useImplementationRisks, ImplementationRisk } from "@/hooks/useImplementationRisks";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TeamMember } from "@/hooks/useTeamMembers";

interface RiskDialogProps {
  risk?: ImplementationRisk;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initiativeId: string;
  teamMembers?: TeamMember[];
}

export function RiskDialog({ risk, open, onOpenChange, initiativeId, teamMembers = [] }: RiskDialogProps) {
  const { createRisk, updateRisk, deleteRisk, isCreating, isUpdating, isDeleting } = useImplementationRisks(initiativeId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    risk_description: risk?.risk_description || "",
    risk_category: risk?.risk_category || "",
    likelihood: risk?.likelihood || "medium",
    impact: risk?.impact || "medium",
    mitigation_strategy: risk?.mitigation_strategy || "",
    contingency_plan: risk?.contingency_plan || "",
    status: risk?.status || "active",
    owner_id: risk?.owner_id || "",
  });

  useEffect(() => {
    if (risk) {
      setFormData({
        risk_description: risk.risk_description,
        risk_category: risk.risk_category,
        likelihood: risk.likelihood,
        impact: risk.impact,
        mitigation_strategy: risk.mitigation_strategy,
        contingency_plan: risk.contingency_plan || "",
        status: risk.status,
        owner_id: risk.owner_id || "",
      });
    } else {
      setFormData({
        risk_description: "",
        risk_category: "",
        likelihood: "medium",
        impact: "medium",
        mitigation_strategy: "",
        contingency_plan: "",
        status: "active",
        owner_id: "",
      });
    }
  }, [risk, open]);

  const handleSubmit = () => {
    const data = {
      risk_description: formData.risk_description,
      risk_category: formData.risk_category,
      likelihood: formData.likelihood as ImplementationRisk["likelihood"],
      impact: formData.impact as ImplementationRisk["impact"],
      mitigation_strategy: formData.mitigation_strategy,
      contingency_plan: formData.contingency_plan || null,
      status: formData.status as ImplementationRisk["status"],
      owner_id: formData.owner_id || null,
    };

    if (risk) {
      updateRisk(
        { id: risk.id, ...data },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createRisk(data, { onSuccess: () => onOpenChange(false) });
    }
  };

  const handleDelete = () => {
    if (risk) {
      deleteRisk(risk.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          onOpenChange(false);
        },
      });
    }
  };

  const getRiskScore = () => {
    const scores = { low: 1, medium: 2, high: 3 };
    return scores[formData.likelihood as keyof typeof scores] * scores[formData.impact as keyof typeof scores];
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{risk ? "Edit Risk" : "Add Implementation Risk"}</DialogTitle>
            <DialogDescription>
              {risk ? "Update risk details" : "Document a potential implementation risk"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="risk_description">Risk Description *</Label>
              <Textarea
                id="risk_description"
                value={formData.risk_description}
                onChange={(e) => setFormData({ ...formData, risk_description: e.target.value })}
                rows={2}
                placeholder="Describe the potential risk"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="risk_category">Category *</Label>
              <Input
                id="risk_category"
                value={formData.risk_category}
                onChange={(e) => setFormData({ ...formData, risk_category: e.target.value })}
                placeholder="e.g., Resources, Leadership, Staff Buy-in, Training"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="likelihood">Likelihood</Label>
                <Select value={formData.likelihood} onValueChange={(value) => setFormData({ ...formData, likelihood: value as ImplementationRisk["likelihood"] })}>
                  <SelectTrigger id="likelihood">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="impact">Impact</Label>
                <Select value={formData.impact} onValueChange={(value) => setFormData({ ...formData, impact: value as ImplementationRisk["impact"] })}>
                  <SelectTrigger id="impact">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Risk Score</Label>
                <div className="flex items-center justify-center h-10 px-3 rounded-md border border-input bg-background">
                  <span className="font-semibold">{getRiskScore()}/9</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mitigation_strategy">Mitigation Strategy *</Label>
              <Textarea
                id="mitigation_strategy"
                value={formData.mitigation_strategy}
                onChange={(e) => setFormData({ ...formData, mitigation_strategy: e.target.value })}
                rows={3}
                placeholder="What actions will you take to prevent or reduce this risk?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contingency_plan">Contingency Plan</Label>
              <Textarea
                id="contingency_plan"
                value={formData.contingency_plan}
                onChange={(e) => setFormData({ ...formData, contingency_plan: e.target.value })}
                rows={3}
                placeholder="What will you do if this risk is realized?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner_id">Risk Owner</Label>
              <Select 
                value={formData.owner_id || ""} 
                onValueChange={(value) => setFormData({ ...formData, owner_id: value || "" })}
              >
                <SelectTrigger id="owner_id">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                {teamMembers.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name || member.profiles?.full_name || "Unnamed Member"}
                  </SelectItem>
                ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as ImplementationRisk["status"] })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="mitigated">Mitigated</SelectItem>
                  <SelectItem value="occurred">Occurred</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between pt-4">
              {risk && (
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!formData.risk_description || !formData.risk_category || !formData.mitigation_strategy || isCreating || isUpdating}
                >
                  {isCreating || isUpdating ? "Saving..." : risk ? "Save Changes" : "Add Risk"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {risk && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Risk?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this risk. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
