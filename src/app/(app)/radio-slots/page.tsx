import RadioSlotForm from "./radio-slot-form";

export default function RadioSlotsPage() {
  return (
    <main className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">Radio Slots</h1>
      <p className="text-muted-foreground">Log radio appearances and reach for broadcasts.</p>
      <RadioSlotForm />
    </main>
  );
}
