import IconComponent from "@/components/genericIconComponent";
import ShadTooltip from "@/components/shadTooltipComponent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useFlowStore from "@/stores/flowStore";
import { useState } from "react";

export default function SessionSelector({
  deleteSession,
  session,
  toggleVisibility,
  isVisible,
  inspectSession,
}: {
  deleteSession: (session: string) => void;
  session: string;
  toggleVisibility: () => void;
  isVisible: boolean;
  inspectSession: (session: string) => void;
}) {
  const currentFlowId = useFlowStore((state) => state.currentFlow?.id);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSession, setEditedSession] = useState(session);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedSession(e.target.value);
  };

  const handleConfirm = () => {
    setIsEditing(false);
    // Here you would typically update the session name in your state or backend
    console.log("Updated session name:", editedSession);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedSession(session);
  };

  return (
    <div
      onDoubleClick={handleEditClick}
      className="file-component-accordion-div group cursor-pointer"
    >
      <div className="flex w-full items-center justify-between gap-2 overflow-hidden border-b px-2 py-3.5 align-middle">
        <div className="flex min-w-0 items-center gap-2">
          {isEditing ? (
            <Input
              value={editedSession}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  handleConfirm();
                }
              }}
              onChange={handleInputChange}
              onBlur={handleCancel}
              autoFocus
              className="h-6 px-1 py-0"
            />
          ) : (
            <ShadTooltip styleClasses="z-50" content={session}>
              <div>
                <Badge variant="gray" size="md" className="block truncate">
                  {session === currentFlowId ? "Default Session" : session}
                </Badge>
              </div>
            </ShadTooltip>
          )}
          {!isEditing && (
            <Button
              unstyled
              size="icon"
              onClick={handleEditClick}
              className="ml-2 opacity-0 group-hover:opacity-100"
            >
              <ShadTooltip styleClasses="z-50" content="Edit Session Name">
                <div>
                  <IconComponent name="SquarePen" className="h-4 w-4" />
                </div>
              </ShadTooltip>
            </Button>
          )}
          {isEditing && (
            <div className="flex items-center">
              <Button
                unstyled
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirm();
                }}
                className="mr-1"
              >
                <ShadTooltip styleClasses="z-50" content="Confirm">
                  <div>
                    <IconComponent
                      name="Check"
                      className="h-4 w-4 text-green-500"
                    />
                  </div>
                </ShadTooltip>
              </Button>
              <Button
                unstyled
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel();
                }}
              >
                <ShadTooltip styleClasses="z-50" content="Cancel">
                  <div>
                    <IconComponent name="X" className="h-4 w-4 text-red-500" />
                  </div>
                </ShadTooltip>
              </Button>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center justify-center gap-2 align-middle">
          <Button
            unstyled
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              toggleVisibility();
            }}
          >
            <ShadTooltip styleClasses="z-50" content="Toggle Visibility">
              <div>
                <IconComponent
                  name={!isVisible ? "EyeOff" : "Eye"}
                  className="h-4 w-4"
                />
              </div>
            </ShadTooltip>
          </Button>
          <Button
            unstyled
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              inspectSession(session);
            }}
          >
            <ShadTooltip styleClasses="z-50" content="Table View">
              <div>
                <IconComponent name="Table" className="h-4 w-4" />
              </div>
            </ShadTooltip>
          </Button>
          <Button
            unstyled
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              deleteSession(session);
            }}
          >
            <ShadTooltip styleClasses="z-50" content="Delete">
              <div>
                <IconComponent name="Trash2" className="h-4 w-4" />
              </div>
            </ShadTooltip>
          </Button>
        </div>
      </div>
    </div>
  );
}