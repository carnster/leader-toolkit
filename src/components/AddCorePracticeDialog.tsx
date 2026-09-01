import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useActiveIngredients } from "@/hooks/useActiveIngredients";

interface AddCorePracticeDialogProps {
  initiativeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Fast Track's "author your own" path, used when the mandated practice is not
 * in the template library. It enforces the floor: a core practice is not
 * complete until it has a name and at least a Delivery look-for. Look-fors are
 * written in the same two-dimension shape ("Delivery:" / "Enactment:") that
 * imported templates use, so the /fast-track view renders them identically.
 */
export function AddCorePracticeDialog({ initiativeId, open, onOpenChange }: AddCorePracticeDialogProps) {
  const { createIngredient, isCreating } = useActiveIngredients(initiativeId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [delivery, setDelivery] = useState("");
  const [enactment, setEnactment] = useState("");

  const canSubmit = name.trim() && delivery.trim() && !isCreating;

  const reset = () => {
    setName("");
    setDescription("");
    setDelivery("");
    setEnactment("");
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const lookFors = [`Delivery: ${delivery.trim()}`];
    if (enactment.trim()) lookFors.push(`Enactment: ${enactment.trim()}`);

    createIngredient(
      {
        initiative_id: initiativeId,
        name: name.trim(),
        description: description.trim() || null,
        category: null,
        is_core: true,
        look_fors: lookFors,
        adaptable_boundaries: null,
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (isCreating ? null : onOpenChange(o))}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a core practice</DialogTitle>
          <DialogDescription>
            One of the practices that has to be right for this mandate to count. Name it, then say
            what it looks like when it is happening (Delivery) and when it is actually working
            (Enactment).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="cp-name">Practice</Label>
            <Input
              id="cp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weekly data team meeting"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-desc">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="cp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-delivery">Delivery look-for</Label>
            <Textarea
              id="cp-delivery"
              value={delivery}
              onChange={(e) => setDelivery(e.target.value)}
              placeholder="What you would see if the practice is in place at all."
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-enactment">
              Enactment look-for <span className="text-muted-foreground font-normal">(recommended)</span>
            </Label>
            <Textarea
              id="cp-enactment"
              value={enactment}
              onChange={(e) => setEnactment(e.target.value)}
              placeholder="What you would see if it is actually working for students, not just happening."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isCreating ? "Adding..." : "Add practice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
