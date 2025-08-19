import MatchList from "@/components/MatchList";

const MatchesPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">Wedstrijden</h1>
        <p className="text-muted-foreground">Overzicht van alle wedstrijden</p>
      </div>
      <MatchList />
    </div>
  );
};

export default MatchesPage;