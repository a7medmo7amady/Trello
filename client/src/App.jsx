import { BoardProvider } from './context/BoardProvider';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import Board from './components/Board';
import './styles/global.css';
import './styles/components.css';

function App() {
  return (
    <BoardProvider>
      <div className="App min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-red-950/20 flex flex-col">
        <Header />
        <Toolbar />
        <main className="flex-1 flex overflow-hidden">
          <Board />
        </main>
      </div>
    </BoardProvider>
  );
}

export default App;
