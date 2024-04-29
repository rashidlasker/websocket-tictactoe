import { Button } from "./ui/button";

const Game: React.FC = () =>{
    const size = 3;
    return (
      <div>
        <h1 className="text-4xl font-bold">Tic Tac Toe</h1>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: size * size }).map((_, index) => (
            <button
              key={index}
              className="bg-gray-200 h-24 w-24 flex items-center justify-center text-2xl font-bold"
            >
              {index}
            </button>
          ))}
        </div>
        <Button>
          Reset
        </Button>
      </div>
    );
  }
  
  export default Game;