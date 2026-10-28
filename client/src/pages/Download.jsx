import { Link, useSearchParams } from 'react-router-dom';
import Analyzer from '../components/Analyzer.jsx';
import useSeo from '../useSeo.js';

export default function Download() {
  const [params] = useSearchParams();
  const url = params.get('url') || '';
  useSeo({ title: 'YouTube video preview & download | Savely', description: 'Preview your YouTube video and choose an available MP4 quality or MP3 audio.', path: '/download' });
  return (
    <section className="page download-page">
      <div className="wrap">
        <Link className="pill" to="/youtube">← YouTube downloader</Link>
        <div className="eyebrow" style={{ marginTop: 28 }}>YouTube video downloader</div>
        <h1 style={{ marginTop: 12 }}>Preview. Choose quality. <span className="gradient-text">Download.</span></h1>
        <p className="lead">Choose from the formats available for your video. MP4 downloads include video and audio.</p>
        <Analyzer initial={url} preview />
        <p className="note" style={{ marginTop: 24 }}>Only download videos you own or have permission to save.</p>
      </div>
    </section>
  );
}
