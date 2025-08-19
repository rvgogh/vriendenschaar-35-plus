import EventList from "@/components/EventList";

const EventsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">Evenementen</h1>
        <p className="text-muted-foreground">Overzicht van alle evenementen</p>
      </div>
      <EventList />
    </div>
  );
};

export default EventsPage;