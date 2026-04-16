import { LuFile, LuFileText, LuImage } from 'react-icons/lu';

function fileExt(filename: string): string {
  const i = filename.lastIndexOf('.');
  return i >= 0 ? filename.slice(i + 1).toLowerCase() : '';
}

function IconForFile({ name }: { name: string }) {
  const ext = fileExt(name);
  if (ext === 'pdf') return <LuFileText size={14} aria-hidden />;
  if (ext === 'doc' || ext === 'docx') return <LuFileText size={14} aria-hidden />;
  if (ext === 'xls' || ext === 'xlsx' || ext === 'csv') return <LuFileText size={14} aria-hidden />;
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return <LuImage size={14} aria-hidden />;
  return <LuFile size={14} aria-hidden />;
}

function chipClass(name: string): string {
  const ext = fileExt(name);
  if (ext === 'pdf') return 'mail-inbox-list__chip-icon mail-inbox-list__chip-icon--pdf';
  if (ext === 'doc' || ext === 'docx') return 'mail-inbox-list__chip-icon mail-inbox-list__chip-icon--doc';
  if (ext === 'xls' || ext === 'xlsx') return 'mail-inbox-list__chip-icon mail-inbox-list__chip-icon--sheet';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext))
    return 'mail-inbox-list__chip-icon mail-inbox-list__chip-icon--image';
  return 'mail-inbox-list__chip-icon';
}

type Props = {
  names: string[];
};

export function InboxAttachmentChips({ names }: Props) {
  return (
    <ul className="mail-inbox-list__chip-list">
      {names.map((name, i) => (
        <li key={`${i}-${name}`} className="mail-inbox-list__chip">
          <span className={chipClass(name)}>
            <IconForFile name={name} />
          </span>
          <span className="mail-inbox-list__chip-label">{name}</span>
        </li>
      ))}
    </ul>
  );
}
