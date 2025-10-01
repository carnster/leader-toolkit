import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { useTeamMembers, TeamMember } from "@/hooks/useTeamMembers";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface TeamMemberDialogProps {
  member?: TeamMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initiativeId: string;
}

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
              <Input
                id="role"
                value={formData.role_in_initiative}
                onChange={(e) => setFormData({ ...formData, role_in_initiative: e.target.value })}
                placeholder="e.g., Implementation Lead, Coach, Teacher"
              />
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
