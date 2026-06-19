export interface EventData {
  id: number;
  name: string;
  energy: number;
  intensity: number;
  color: [number, number, number];
  emissive: [number, number, number];
  roughness: number;
  metalness: number;
  scale: number;
  description: string;
}

export interface SampleData {
  title: string;
  events: EventData[];
}

export type EventChangeListener = (event: EventData, index: number) => void;

class EventManager {
  private data: SampleData | null = null;
  private currentIndex = 0;
  private listeners: EventChangeListener[] = [];

  async load(url: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to load events: " + response.status);
    }
    this.data = (await response.json()) as SampleData;
    this.currentIndex = 0;
  }

  async loadFromData(data: SampleData): Promise<void> {
    this.data = data;
    this.currentIndex = 0;
  }

  getEvents(): EventData[] {
    return this.data?.events ?? [];
  }

  getTitle(): string {
    return this.data?.title ?? "";
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  getCurrentEvent(): EventData | null {
    if (!this.data) return null;
    return this.data.events[this.currentIndex] ?? null;
  }

  setIndex(index: number): void {
    if (!this.data) return;
    if (index < 0 || index >= this.data.events.length) return;
    if (index === this.currentIndex) return;
    this.currentIndex = index;
    this.emit();
  }

  onChange(listener: EventChangeListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit(): void {
    const event = this.getCurrentEvent();
    if (!event) return;
    for (const listener of this.listeners) {
      listener(event, this.currentIndex);
    }
  }
}

export const eventManager = new EventManager();