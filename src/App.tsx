import { useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabaseClient';

type Screen = 'home' | 'profile' | 'level' | 'exercise' | 'result' | 'progress' | 'settings' | 'help';
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

type GameSettings = {
  fontSize: 'small' | 'normal' | 'large';
  contrast: 'normal' | 'high';
  notifications: boolean;
  language: 'fr';
};

type SessionRecord = {
  id: string;
  score: number;
  createdAt: string;
};

const STORAGE_KEY = 'memoryplus-state-v1';

const exercises: ExerciseItem[] = [
  { key: 'numbers', label: 'Mémoire de chiffres', description: 'Mémorisez puis reproduisez la suite numérique.' },
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

const defaultSettings: GameSettings = {
  fontSize: 'normal',
  contrast: 'normal',
  notifications: true,
  language: 'fr',
};

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
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);

  const selectedExerciseMeta = useMemo(
    () => exercises.find((exercise) => exercise.key === selectedExercise) ?? exercises[0],
    [selectedExercise],
  );

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Partial<{
        profile: Profile;
        difficulty: Difficulty;
        score: number;
        history: number[];
        sessionCount: number;
        settings: GameSettings;
      }>;

      if (parsed.profile) setProfile(parsed.profile);
      if (parsed.difficulty) setDifficulty(parsed.difficulty);
      if (typeof parsed.score === 'number') setScore(parsed.score);
      if (Array.isArray(parsed.history)) setHistory(parsed.history);
      if (typeof parsed.sessionCount === 'number') setSessionCount(parsed.sessionCount);
      if (parsed.settings) setSettings({ ...defaultSettings, ...parsed.settings });
    } catch (error) {
      console.warn('Impossible de lire la progression locale', error);
    }
  }, []);

  useEffect(() => {
    const payload = {
      profile,
      difficulty,
      score,
      history,
      sessionCount,
      settings,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [profile, difficulty, score, history, sessionCount, settings]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--font-scale', settings.fontSize === 'small' ? '0.92' : settings.fontSize === 'large' ? '1.12' : '1');
    root.style.setProperty('--contrast-bg', settings.contrast === 'high' ? '#f8fafc' : '#f5f7fb');
    root.style.setProperty('--contrast-text', settings.contrast === 'high' ? '#020617' : '#0f172a');
  }, [settings]);

  const saveToSupabase = async (exerciseName: string, currentScore: number) => {
    if (!supabase) return;

    try {
      await supabase.from('sessions').insert([
        {
          profile_id: 'demo-profile',
          exercise_name: exerciseName,
          score: currentScore,
          total: 1,
        },
      ]);
    } catch (error) {
      console.warn('Supabase indisponible ou non configuré', error);
    }
  };

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
      passed = ['rouge', 'bleu', 'vert'].includes(normalized);
    }

    if (selectedExercise === 'attention') {
      const normalized = attentionAnswer.trim().toLowerCase();
      passed = ['rouge', 'rond', 'bleu'].includes(normalized);
    }

    if (selectedExercise === 'differences') {
      const normalized = answer.trim().toLowerCase();
      passed = ['2', 'deux'].includes(normalized);
    }

    if (selectedExercise === 'logic') {
      const normalized = logicAnswer.trim().toLowerCase();
      passed = ['16', 'grand', 'cercle'].includes(normalized);
    }

    if (selectedExercise === 'missing') {
      const normalized = answer.trim().toLowerCase();
      passed = ['maison', 'lampe'].includes(normalized);
    }

    const nextScore = passed ? 1 : 0;
    const nextTotalScore = score + nextScore;
    setScore(nextTotalScore);
    setSessionCount((prev) => prev + 1);
    setHistory((prev) => [...prev, nextScore]);
    void saveToSupabase(selectedExerciseMeta.label, nextScore);
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
              <button onClick={() => { setDifficulty('easy'); setScreen('exercise'); }}>Débutant</button>
              <button onClick={() => { setDifficulty('medium'); setScreen('exercise'); }}>Intermédiaire</button>
              <button onClick={() => { setDifficulty('hard'); setScreen('exercise'); }}>Avancé</button>
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
                <button className="small-btn" onClick={() => setSettings((prev) => ({ ...prev, fontSize: prev.fontSize === 'large' ? 'normal' : 'large' }))}>Standard</button>
              </div>
              <div className="setting-item">
                <span>Contraste</span>
                <button className="small-btn" onClick={() => setSettings((prev) => ({ ...prev, contrast: prev.contrast === 'high' ? 'normal' : 'high' }))}>Fort</button>
              </div>
              <div className="setting-item">
                <span>Notifications</span>
                <button className="small-btn" onClick={() => setSettings((prev) => ({ ...prev, notifications: !prev.notifications }))}>
                  {settings.notifications ? 'Oui' : 'Non'}
                </button>
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
