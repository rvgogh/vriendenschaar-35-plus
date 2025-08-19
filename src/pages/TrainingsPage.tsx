import TrainingList from "@/components/TrainingList";

const TrainingsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">Trainingen</h1>
        <p className="text-muted-foreground">Overzicht van alle trainingen</p>
      </div>
      <TrainingList />
    </div>
  );
};

export default TrainingsPage;