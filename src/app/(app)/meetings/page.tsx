import MeetingForm from "./meeting-form";

export default function MeetingsPage() {
  return (
    <main className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">Meetings</h1>
      <p className="text-muted-foreground">Create and manage scheduled meetings.</p>
      <MeetingForm />
    </main>
  );
}
