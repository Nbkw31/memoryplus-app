import { useMemo, useState } from 'react';

type Screen = 'home' | 'profile' | 'level' | 'exercise' | 'result' | 'progress' | 'settings';
type Profile = 'senior' | 'family' | 'standard';
type Difficulty = 'easy' | 'medium' | 'hard';
type ExerciseKey =
  | 'numbers'
  | 'visual'
  | 'words'
  | 'shapes'
  | 'attention'
  | 'differences'
  | 'logic'
  | 'missing';

type ExerciseItem = {
  key: ExerciseKey;
  label: string;
  description: string;
};

const exercises: ExerciseItem[] = [
  { key: 'numbers', label: 'Mémoire de chiffres', description: 'Mémorisez et reproduisez une suite numérique.' },
  { key: 'visual', label: 'Mémoire visuelle', description: 'Retrouvez les objets déjà vus.' },
  { key: 'words', label: 'Mémorisation de mots', description: 'Rappelez les mots dans l’ordre.' },
  { key: 'shapes', label: 'Séquences de formes', description: 'Reproduisez la suite visuelle.' },
  { key: 'attention', label: 'Attention visuelle', description: 'Repérez un élément précis.' },
  { key: 'differences', label: 'Trouver les différences', description: 'Comparez les images et repérez les écarts.' },
  { key: 'logic', label: 'Ordre logique', description: 'Complétez la suite logique.' },
  { key: 'missing', label: 'Objet manquant', description: 'Repérez ce qui manque ou a changé.' },
];

const wordLists = [
  ['maison', 'fenêtre', 'chien', 'soleil', 'livre'],
  ['lampe', 'jardin', 'route', 'musique', 'puzzle'],
  ['voiture', 'nuage', 'table', 'orchestre', 'arbre'],
  ['carnet', 'pomme', 'porte', 'bougie', 'pluie'],
];

const visualLists = [
  ['pomme', 'chaise', 'lampe', 'livre', 'montre'],
  ['chien', 'fleur', 'téléphone', 'carnet', 'balle'],
  ['maison', 'poire', 'guitare', 'vase', 'fenêtre'],
];

const logicPatterns = [
  'rouge / bleu / rouge / bleu / ?',
  '1 / 2 / 4 / 8 / ?',
  'petit / moyen / grand / petit / moyen / ?',
  'cercle / carré / triangle / cercle / ?',
];

const shapeSequence = [
  ['rouge', 'bleu', 'rouge', 'bleu', 'rouge'],
  ['cercle', 'triangle', 'cercle', 'triangle', 'cercle'],
  ['vert', 'jaune', 'vert', 'jaune', 'vert'],
];

function buildSequence(length: number) {
  return Array.from({ length }, () => Math.floor(Math.random() * 9));
}

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [profile, setProfile] = useState<Profile>('senior');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseKey>('numbers');
  const [sequence, setSequence] = useState<number[]>([]);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [wordSet, setWordSet] = useState<string[]>([]);
  const [visualSet, setVisualSet] = useState<string[]>([]);
  const [selectedVisualItems, setSelectedVisualItems] = useState<string[]>([]);
  const [logicPrompt, setLogicPrompt] = useState('');
  const [logicAnswer, setLogicAnswer] = useState('');
  const [attentionPrompt, setAttentionPrompt] = useState('Trouver le mot rouge');
  const [attentionAnswer, setAttentionAnswer] = useState('');

  const selectedExerciseMeta = useMemo(
    () => exercises.find((exercise) => exercise.key === selectedExercise) ?? exercises[0],
    [selectedExercise],
  );

  const startExercise = (exerciseKey: ExerciseKey) => {
    setSelectedExercise(exerciseKey);
    setAnswer('');
    setLogicAnswer('');
    setAttentionAnswer('');
    setSelectedVisualItems([]);

    switch (exerciseKey) {
      case 'numbers': {
        const length = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
        setSequence(buildSequence(length));
        break;
      }
      case 'words': {
        const words = wordLists[Math.floor(Math.random() * wordLists.length)];
        setWordSet(words);
        break;
      }
      case 'visual': {
        const items = visualLists[Math.floor(Math.random() * visualLists.length)];
        setVisualSet(items);
        break;
      }
      case 'shapes': {
        const pattern = shapeSequence[Math.floor(Math.random() * shapeSequence.length)];
        setLogicPrompt(pattern.join(' / '));
        break;
      }
      case 'logic': {
        const pattern = logicPatterns[Math.floor(Math.random() * logicPatterns.length)];
        setLogicPrompt(pattern);
        break;
      }
      case 'attention': {
        const prompts = ['Trouver le mot rouge', 'Trouver la forme ronde', 'Trouver le mot bleu'];
        setAttentionPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
        break;
      }
      default:
        break;
    }

    setScreen('exercise');
  };

  const validateExercise = () => {
    let passed = false;

    if (selectedExercise === 'numbers') {
      passed = answer.replace(/\s+/g, '') === sequence.join('');
    }

    if (selectedExercise === 'words') {
      const expected = wordSet.map((word) => word.toLowerCase());
      const user = answer.toLowerCase().split(/\s+/).filter(Boolean);
      passed = user.length === expected.length && expected.every((word, index) => word === user[index]);
    }

    if (selectedExercise === 'visual') {
      passed = selectedVisualItems.length >= 2;
    }

    if (selectedExercise === 'shapes') {
      const normalized = logicAnswer.trim().toLowerCase();
      passed = normalized === 'rouge' || normalized === 'bleu' || normalized === 'vert';
    }

    if (selectedExercise === 'attention') {
      const normalized = attentionAnswer.trim().toLowerCase();
      passed = normalized === 'rouge' || normalized === 'rond' || normalized === 'bleu';
    }

    if (selectedExercise === 'differences') {
      const normalized = answer.trim().toLowerCase();
      passed = normalized === '2' || normalized === 'deux';
    }

    if (selectedExercise === 'logic') {
      const normalized = logicAnswer.trim().toLowerCase();
      passed = normalized === '16' || normalized === 'grand' || normalized === 'cercle';
    }

    if (selectedExercise === 'missing') {
      const normalized = answer.trim().toLowerCase();
      passed = normalized === 'maison' || normalized === 'lampe';
    }

    const nextScore = passed ? 1 : 0;
    setScore((prev) => prev + nextScore);
    setSessionCount((prev) => prev + 1);
    setHistory((prev) => [...prev, nextScore]);
    setScreen('result');
  };

  const averageScore = history.length > 0
    ? (history.reduce((sum, value) => sum + value, 0) / history.length) * 100
    : 0;

  const resetStats = () => {
    setScore(0);
    setSessionCount(0);
    setHistory([]);
    setScreen('home');
  };

  const toggleVisualItem = (item: string) => {
    setSelectedVisualItems((prev) =>
      prev.includes(item) ? prev.filter((value) => value !== item) : [...prev, item],
    );
  };

  return (
    <div className="app-shell">
      <div className="card">
        {screen === 'home' && (
          <>
            <div className="brand">
              <div className="logo">M+</div>
              <h1>MemoryPlus</h1>
            </div>

            <p className="tagline">“Stimulez votre mémoire, renforcez votre confiance”</p>

            <div className="button-stack">
              <button onClick={() => setScreen('profile')}>Commencer</button>
              <button className="secondary" onClick={() => setScreen('progress')}>Progression</button>
              <button className="secondary" onClick={() => setScreen('settings')}>Paramètres</button>
            </div>

            <div className="feature-list">
              <div className="mini-card">3 min/jour</div>
              <div className="mini-card">8 exercices</div>
              <div className="mini-card">Sans pression</div>
            </div>

            <div className="exercise-list">
              {exercises.map((exercise) => (
                <button key={exercise.key} className="exercise-option" onClick={() => startExercise(exercise.key)}>
                  {exercise.label}
                </button>
              ))}
            </div>
          </>
        )}

        {screen === 'profile' && (
          <>
            <h2>Qui utilise l’application ?</h2>
            <div className="selection-list">
              <button onClick={() => { setProfile('senior'); setScreen('level'); }}>Personne âgée</button>
              <button onClick={() => { setProfile('family'); setScreen('level'); }}>Aidant / famille</button>
              <button onClick={() => { setProfile('standard'); setScreen('level'); }}>Utilisateur standard</button>
            </div>
          </>
        )}

        {screen === 'level' && (
          <>
            <h2>Choisissez votre niveau</h2>
            <div className="selection-list">
              <button onClick={() => { setDifficulty('easy'); startExercise(selectedExercise); }}>Débutant</button>
              <button onClick={() => { setDifficulty('medium'); startExercise(selectedExercise); }}>Intermédiaire</button>
              <button onClick={() => { setDifficulty('hard'); startExercise(selectedExercise); }}>Avancé</button>
            </div>
          </>
        )}

        {screen === 'exercise' && (
          <>
            <div className="header-line">
              <span>{selectedExerciseMeta.label}</span>
              <span>{difficulty}</span>
            </div>

            <div className="exercise-panel">
              {selectedExercise === 'numbers' && (
                <>
                  <p>Observez la suite puis réécrivez-la.</p>
                  <div className="sequence">{sequence.length ? sequence.join(' ') : '...'}</div>
                  <input
                    className="answer-input"
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder="Ex : 38526"
                  />
                </>
              )}

              {selectedExercise === 'words' && (
                <>
                  <p>Observez les mots puis réécrivez-les dans l’ordre.</p>
                  <div className="word-grid">
                    {wordSet.map((word, index) => (
                      <span key={`${word}-${index}`} className="word-pill">{word}</span>
                    ))}
                  </div>
                  <input
                    className="answer-input"
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder="Ex : maison lampe chien"
                  />
                </>
              )}

              {selectedExercise === 'visual' && (
                <>
                  <p>Choisissez les objets que vous avez vus.</p>
                  <div className="object-grid">
                    {visualSet.map((item) => (
                      <button
                        key={item}
                        className={`object-button ${selectedVisualItems.includes(item) ? 'active' : ''}`}
                        onClick={() => toggleVisualItem(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {selectedExercise === 'shapes' && (
                <>
                  <p>Complétez la suite de formes / couleurs.</p>
                  <div className="logic-box">{logicPrompt}</div>
                  <input
                    className="answer-input"
                    value={logicAnswer}
                    onChange={(event) => setLogicAnswer(event.target.value)}
                    placeholder="Réponse"
                  />
                </>
              )}

              {selectedExercise === 'attention' && (
                <>
                  <p>{attentionPrompt}</p>
                  <div className="attention-box">
                    <span>rouge</span>
                    <span>vert</span>
                    <span>bleu</span>
                    <span>jaune</span>
                    <span>rouge</span>
                    <span>vert</span>
                  </div>
                  <input
                    className="answer-input"
                    value={attentionAnswer}
                    onChange={(event) => setAttentionAnswer(event.target.value)}
                    placeholder="Réponse"
                  />
                </>
              )}

              {selectedExercise === 'differences' && (
                <>
                  <p>Combien de différences voyez-vous entre les deux images ?</p>
                  <div className="logic-box">Image A / Image B</div>
                  <input
                    className="answer-input"
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder="Ex : 2"
                  />
                </>
              )}

              {selectedExercise === 'logic' && (
                <>
                  <p>Complétez la suite logique.</p>
                  <div className="logic-box">{logicPrompt}</div>
                  <input
                    className="answer-input"
                    value={logicAnswer}
                    onChange={(event) => setLogicAnswer(event.target.value)}
                    placeholder="Réponse"
                  />
                </>
              )}

              {selectedExercise === 'missing' && (
                <>
                  <p>Quel élément manque à cette liste ?</p>
                  <div className="logic-box">lampe • table • chaise • ____</div>
                  <input
                    className="answer-input"
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder="Réponse"
                  />
                </>
              )}
            </div>

            <div className="button-stack">
              <button onClick={validateExercise}>Valider</button>
              <button className="secondary" onClick={() => setScreen('home')}>Accueil</button>
            </div>
          </>
        )}

        {screen === 'result' && (
          <>
            <h2>Résultat</h2>
            <div className="score-box">{score > 0 ? 'Très bien !' : 'Essayez encore !'}</div>
            <p className="score-number">{score} point(s)</p>

            <div className="button-stack">
              <button onClick={() => startExercise(selectedExercise)}>Rejouer</button>
              <button className="secondary" onClick={() => setScreen('home')}>Accueil</button>
            </div>
          </>
        )}

        {screen === 'progress' && (
          <>
            <h2>Ma progression</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <span>Sessions</span>
                <strong>{sessionCount}</strong>
              </div>
              <div className="stat-card">
                <span>Moyenne</span>
                <strong>{Math.round(averageScore)}%</strong>
              </div>
            </div>

            <div className="history-row">
              {history.length > 0 ? (
                history.map((value, index) => (
                  <span key={index} className={value ? 'good' : 'bad'}>
                    {value ? '✓' : '✕'}
                  </span>
                ))
              ) : (
                <p>Aucune séance pour le moment.</p>
              )}
            </div>

            <div className="button-stack">
              <button onClick={() => setScreen('home')}>Accueil</button>
              <button className="secondary" onClick={resetStats}>Réinitialiser</button>
            </div>
          </>
        )}

        {screen === 'settings' && (
          <>
            <h2>Paramètres</h2>
            <div className="settings-list">
              <div className="setting-item">
                <span>Taille du texte</span>
                <button className="small-btn">Standard</button>
              </div>
              <div className="setting-item">
                <span>Contraste</span>
                <button className="small-btn">Fort</button>
              </div>
              <div className="setting-item">
                <span>Notifications</span>
                <button className="small-btn">Oui</button>
              </div>
              <div className="setting-item">
                <span>Langue</span>
                <button className="small-btn">Français</button>
              </div>
            </div>

            <div className="button-stack">
              <button onClick={() => setScreen('home')}>Retour</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
