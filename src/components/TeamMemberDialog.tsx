import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useTeamMembers, TeamMember } from "@/hooks/useTeamMembers";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface TeamMemberDialogProps {
  member?: TeamMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initiativeId: string;
}

const COMMON_ROLES = [
  "Implementation Lead",
  "School Leader/Principal",
  "Instructional Coach",
  "Teacher/Practitioner",
  "District Administrator",
  "Data Analyst",
  "Family/Community Liaison",
  "Support Staff",
  "Professional Development Coordinator",
];

const ROLE_RESPONSIBILITIES: Record<string, string[]> = {
  "Implementation Lead": ["Oversee implementation timeline", "Coordinate team meetings", "Monitor fidelity", "Report to stakeholders"],
  "School Leader/Principal": ["Provide administrative support", "Allocate resources", "Remove barriers", "Champion the initiative"],
  "Instructional Coach": ["Provide ongoing coaching", "Model practices", "Observe and give feedback", "Facilitate professional learning"],
  "Teacher/Practitioner": ["Implement core components", "Collect student data", "Participate in PD", "Share feedback"],
  "District Administrator": ["Secure funding", "Align with district goals", "Provide policy support", "Facilitate communication"],
  "Data Analyst": ["Track indicators", "Analyze results", "Create dashboards", "Present findings"],
  "Family/Community Liaison": ["Engage families", "Gather community input", "Communicate progress", "Build partnerships"],
  "Support Staff": ["Provide logistical support", "Coordinate schedules", "Manage materials", "Document meetings"],
  "Professional Development Coordinator": ["Plan PD sessions", "Secure facilitators", "Track attendance", "Evaluate training effectiveness"],
};

export function TeamMemberDialog({ member, open, onOpenChange, initiativeId }: TeamMemberDialogProps) {
  const { addTeamMember, updateTeamMember, removeTeamMember, isAdding, isUpdating, isRemoving } = useTeamMembers(initiativeId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    user_id: member?.user_id || "",
    role_in_initiative: member?.role_in_initiative || "",
    responsibilities: member?.responsibilities || [""],
  });

  useEffect(() => {
    if (member) {
      setFormData({
        user_id: member.user_id,
        role_in_initiative: member.role_in_initiative,
        responsibilities: member.responsibilities && member.responsibilities.length > 0 ? member.responsibilities : [""],
      });
    } else {
      setFormData({
        user_id: "",
        role_in_initiative: "",
        responsibilities: [""],
      });
    }
  }, [member, open]);

  const handleRoleChange = (role: string) => {
    setFormData({ ...formData, role_in_initiative: role });
    
    // Suggest responsibilities based on role
    if (ROLE_RESPONSIBILITIES[role] && formData.responsibilities.length === 1 && !formData.responsibilities[0]) {
      setFormData({ 
        ...formData, 
        role_in_initiative: role,
        responsibilities: ROLE_RESPONSIBILITIES[role] 
      });
    }
  };

  const handleSubmit = () => {
    const data = {
      user_id: formData.user_id,
      role_in_initiative: formData.role_in_initiative,
      responsibilities: formData.responsibilities.filter(r => r.trim() !== ""),
    };

    if (member) {
      updateTeamMember(
        { id: member.id, ...data },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      addTeamMember(data, { onSuccess: () => onOpenChange(false) });
    }
  };

  const handleDelete = () => {
    if (member) {
      removeTeamMember(member.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          onOpenChange(false);
        },
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{member ? "Edit Team Member" : "Add Team Member"}</DialogTitle>
            <DialogDescription>
              {member ? "Update team member details" : "Add a new member to the implementation team"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user_id">User ID *</Label>
              <Input
                id="user_id"
                value={formData.user_id}
                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                placeholder="Enter user ID"
                disabled={!!member}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role in Initiative *</Label>
              <Select value={formData.role_in_initiative} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Responsibilities</Label>
              {formData.responsibilities.map((resp, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={resp}
                    onChange={(e) => {
                      const newResponsibilities = [...formData.responsibilities];
                      newResponsibilities[index] = e.target.value;
                      setFormData({ ...formData, responsibilities: newResponsibilities });
                    }}
                    placeholder={`Responsibility ${index + 1}`}
                  />
                  {formData.responsibilities.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newResponsibilities = formData.responsibilities.filter((_, i) => i !== index);
                        setFormData({ ...formData, responsibilities: newResponsibilities });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFormData({ ...formData, responsibilities: [...formData.responsibilities, ""] })}
              >
                <Plus className="mr-2 h-3 w-3" />
                Add Responsibility
              </Button>
            </div>

            <div className="flex justify-between pt-4">
              {member && (
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!formData.user_id || !formData.role_in_initiative || isAdding || isUpdating}
                >
                  {isAdding || isUpdating ? "Saving..." : member ? "Save Changes" : "Add Member"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {member && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Team Member?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove this member from the initiative team. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isRemoving}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isRemoving ? "Removing..." : "Remove"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
