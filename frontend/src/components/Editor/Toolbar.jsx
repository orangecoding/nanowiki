/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { useState, useEffect, useRef } from 'react';
import { Icon } from '../Icon.jsx';
import { FileLinkPicker } from './FileLinkPicker.jsx';
import { Toast } from '../Toast.jsx';
import { getLlmConfig, rewriteWithLlm } from '../../api.js';

function TbBtn({ onClick, active, title, children, variant, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={`tb-btn${active ? ' active' : ''}${variant ? ` tb-btn--${variant}` : ''}`}
    >
      {children}
    </button>
  );
}

const TONES = ['Neutral', 'Formal', 'Casual', 'Friendly'];
const STYLES = ['Professional', 'Creative', 'Concise', 'Detailed'];

export function Toolbar({ editor }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [llmProvider, setLlmProvider] = useState(null);
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const [tone, setTone] = useState('Neutral');
  const [style, setStyle] = useState('Professional');
  const [prevContent, setPrevContent] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [popPos, setPopPos] = useState({ top: 0, left: 0 });
  const aiButtonRef = useRef(null);

  useEffect(() => {
    getLlmConfig()
      .then(({ provider }) => setLlmProvider(provider))
      .catch(() => {});
  }, []);

  if (!editor) return null;

  const setLink = () => {
    const url = prompt('Enter URL:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const handleRewrite = async () => {
    setRewriteOpen(false);
    const markdown = editor.storage.markdown.getMarkdown();
    if (prevContent === null) setPrevContent(markdown);
    setRewriting(true);
    try {
      const { result } = await rewriteWithLlm(markdown, tone, style);
      editor.commands.setContent(result);
    } catch (err) {
      setPrevContent(null);
      setToastMsg(err.message || 'Rewrite failed. Please try again.');
    } finally {
      setRewriting(false);
    }
  };

  const handleRevert = () => {
    if (!prevContent) return;
    editor.commands.setContent(prevContent);
    setPrevContent(null);
  };

  return (
    <>
      <div className="toolbar">
        {/* AI Rewrite — only rendered when a provider is configured */}
        {llmProvider && (
          <>
            <div className="tb-group">
              {prevContent !== null && (
                <>
                  <TbBtn onClick={() => setPrevContent(null)} title="Accept rewrite">
                    Accept
                  </TbBtn>
                  <TbBtn onClick={handleRevert} title="Revert to original">
                    Revert
                  </TbBtn>
                </>
              )}
              <div ref={aiButtonRef} style={{ display: 'inline-flex' }}>
                <TbBtn
                  onClick={() => {
                    if (rewriting) return;
                    if (!rewriteOpen && aiButtonRef.current) {
                      const r = aiButtonRef.current.getBoundingClientRect();
                      const popW = 260;
                      const left = Math.max(8, Math.min(r.left, window.innerWidth - popW - 8));
                      setPopPos({ top: r.bottom + 8, left });
                    }
                    setRewriteOpen((v) => !v);
                  }}
                  active={rewriteOpen}
                  disabled={rewriting}
                  title="AI Rewrite"
                  variant="ai"
                >
                  {rewriting ? (
                    'Rewriting…'
                  ) : (
                    <>
                      <Icon name="sparkles" size={13} />
                      <span style={{ marginLeft: 5 }}>AI Rewrite</span>
                    </>
                  )}
                </TbBtn>
                {rewriteOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 55 }} onClick={() => setRewriteOpen(false)} />
                    <div
                      className="pop ai-pop"
                      style={{ position: 'fixed', top: popPos.top, left: popPos.left, zIndex: 60 }}
                    >
                      <div className="ai-pop__group">
                        <span className="ai-pop__label">Tone</span>
                        <div className="ai-pop__seg">
                          {TONES.map((t) => (
                            <button
                              key={t}
                              type="button"
                              className={`ai-pop__seg-btn${tone === t ? ' active' : ''}`}
                              onClick={() => setTone(t)}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="ai-pop__group">
                        <span className="ai-pop__label">Style</span>
                        <div className="ai-pop__seg">
                          {STYLES.map((s) => (
                            <button
                              key={s}
                              type="button"
                              className={`ai-pop__seg-btn${style === s ? ' active' : ''}`}
                              onClick={() => setStyle(s)}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="ai-pop__actions">
                        <button className="ai-pop__btn" onClick={() => setRewriteOpen(false)}>
                          Cancel
                        </button>
                        <button className="ai-pop__btn ai-pop__btn--accent" onClick={handleRewrite}>
                          Rewrite
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="tb-sep" />
          </>
        )}

        {/* Headings */}
        <div className="tb-group">
          <TbBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
            variant="h"
          >
            H1
          </TbBtn>
          <TbBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
            variant="h"
          >
            H2
          </TbBtn>
        </div>

        <div className="tb-sep" />

        {/* Inline formatting */}
        <div className="tb-group">
          <TbBtn
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Bold"
            variant="b"
          >
            B
          </TbBtn>
          <TbBtn
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Italic"
            variant="i"
          >
            I
          </TbBtn>
          <TbBtn
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            title="Strikethrough"
            variant="s"
          >
            S
          </TbBtn>
          <TbBtn
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
            title="Inline code"
          >
            <Icon name="code" size={14} />
          </TbBtn>
        </div>

        <div className="tb-sep" />

        {/* Lists & quotes */}
        <div className="tb-group">
          <TbBtn
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Bullet list"
          >
            <Icon name="list" size={14} />
          </TbBtn>
          <TbBtn
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Ordered list"
          >
            <Icon name="listOrdered" size={14} />
          </TbBtn>
          <TbBtn
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="Blockquote"
          >
            <Icon name="quote" size={14} />
          </TbBtn>
        </div>

        <div className="tb-sep" />

        {/* Inserts */}
        <div className="tb-group">
          <TbBtn onClick={setLink} active={editor.isActive('link')} title="Insert link">
            <Icon name="link" size={14} />
          </TbBtn>
          <TbBtn onClick={() => setPickerOpen((v) => !v)} active={pickerOpen} title="Link to file">
            <Icon name="file" size={14} />
          </TbBtn>
          <TbBtn
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive('codeBlock')}
            title="Code block"
          >
            <Icon name="codeBlock" size={14} />
          </TbBtn>
          <TbBtn
            onClick={() => editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run()}
            title="Insert table"
          >
            <Icon name="table" size={14} />
          </TbBtn>
          <TbBtn
            onClick={() => {
              const url = prompt('Image URL:');
              if (url) editor.chain().focus().setImage({ src: url }).run();
            }}
            title="Insert image"
          >
            <Icon name="image" size={14} />
          </TbBtn>
        </div>
      </div>

      {pickerOpen && editor && <FileLinkPicker editor={editor} onClose={() => setPickerOpen(false)} />}
      {toastMsg && <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />}
    </>
  );
}
