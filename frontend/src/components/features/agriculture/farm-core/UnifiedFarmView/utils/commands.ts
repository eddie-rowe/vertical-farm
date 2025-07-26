import { Row, Rack, Shelf } from "@/types/farm-layout";

export interface Command {
  execute(): Promise<void> | void;
  undo(): Promise<void> | void;
  description: string;
}

export class CommandHistory {
  private history: Command[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;

  constructor(maxHistorySize: number = 50) {
    this.maxHistorySize = maxHistorySize;
  }

  execute(command: Command): Promise<void> | void {
    // Remove any commands after current index (when undoing and then executing new command)
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Add new command
    this.history.push(command);
    this.currentIndex++;

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }

    return command.execute();
  }

  undo(): Promise<void> | void {
    if (!this.canUndo()) return;

    const command = this.history[this.currentIndex];
    this.currentIndex--;

    return command.undo();
  }

  redo(): Promise<void> | void {
    if (!this.canRedo()) return;

    this.currentIndex++;
    const command = this.history[this.currentIndex];

    return command.execute();
  }

  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  getUndoDescription(): string | null {
    if (!this.canUndo()) return null;
    return this.history[this.currentIndex].description;
  }

  getRedoDescription(): string | null {
    if (!this.canRedo()) return null;
    return this.history[this.currentIndex + 1].description;
  }

  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  getHistorySize(): number {
    return this.history.length;
  }
}

// Specific command implementations

export class AddElementCommand implements Command {
  constructor(
    private element: Row | Rack | Shelf,
    private elementType: "row" | "rack" | "shelf",
    private addFn: (element: Row | Rack | Shelf) => Promise<void> | void,
    private removeFn: (elementId: string) => Promise<void> | void,
  ) {}

  get description(): string {
    return `Add ${this.elementType}: ${this.element.name}`;
  }

  execute(): Promise<void> | void {
    return this.addFn(this.element);
  }

  undo(): Promise<void> | void {
    return this.removeFn(this.element.id);
  }
}

export class DeleteElementCommand implements Command {
  constructor(
    private element: Row | Rack | Shelf,
    private elementType: "row" | "rack" | "shelf",
    private deleteFn: (elementId: string) => Promise<void> | void,
    private restoreFn: (element: Row | Rack | Shelf) => Promise<void> | void,
  ) {}

  get description(): string {
    return `Delete ${this.elementType}: ${this.element.name}`;
  }

  execute(): Promise<void> | void {
    return this.deleteFn(this.element.id);
  }

  undo(): Promise<void> | void {
    return this.restoreFn(this.element);
  }
}

export class UpdateElementCommand implements Command {
  constructor(
    private elementId: string,
    private elementType: "row" | "rack" | "shelf",
    private oldElement: Row | Rack | Shelf,
    private newElement: Row | Rack | Shelf,
    private updateFn: (element: Row | Rack | Shelf) => Promise<void> | void,
  ) {}

  get description(): string {
    return `Update ${this.elementType}: ${this.newElement.name}`;
  }

  execute(): Promise<void> | void {
    return this.updateFn(this.newElement);
  }

  undo(): Promise<void> | void {
    return this.updateFn(this.oldElement);
  }
}

export class BulkDeleteCommand implements Command {
  constructor(
    private elements: (Row | Rack | Shelf)[],
    private deleteFn: (elementIds: string[]) => Promise<void> | void,
    private restoreFn: (
      elements: (Row | Rack | Shelf)[],
    ) => Promise<void> | void,
  ) {}

  get description(): string {
    return `Delete ${this.elements.length} elements`;
  }

  execute(): Promise<void> | void {
    const elementIds = this.elements.map((el) => el.id);
    return this.deleteFn(elementIds);
  }

  undo(): Promise<void> | void {
    return this.restoreFn(this.elements);
  }
}

export class MoveElementCommand implements Command {
  constructor(
    private elementId: string,
    private elementType: "row" | "rack" | "shelf",
    private fromPosition: { parentId?: string; index: number },
    private toPosition: { parentId?: string; index: number },
    private moveFn: (
      elementId: string,
      toPosition: { parentId?: string; index: number },
    ) => Promise<void> | void,
  ) {}

  get description(): string {
    return `Move ${this.elementType}`;
  }

  execute(): Promise<void> | void {
    return this.moveFn(this.elementId, this.toPosition);
  }

  undo(): Promise<void> | void {
    return this.moveFn(this.elementId, this.fromPosition);
  }
}

// Composite command for complex operations
export class CompositeCommand implements Command {
  constructor(
    private commands: Command[],
    public description: string,
  ) {}

  async execute(): Promise<void> {
    for (const command of this.commands) {
      await command.execute();
    }
  }

  async undo(): Promise<void> {
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      await this.commands[i].undo();
    }
  }
}
