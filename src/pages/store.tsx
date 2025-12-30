'use client'

import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import Backup from '../assets/Backup.png'

type BasicField = {
    id: number
    label: string
    value: string
}

type SourceItem = {
    label: string
    url: string
    color?: string
}

type MenuItem = {
    id: string
    name: string
    preview: string
    ts: string
}

const basicInfoFields: BasicField[] = [
    { id: 1, label: '店舗名', value: '蟹と海鮮ぼんた' },
    { id: 2, label: '公式HP', value: 'https://bonta.co.jp/kurufu/' },
    { id: 3, label: '店舗住所', value: '福井県福井市中央１丁目１－…' },
    { id: 4, label: '営業時間', value: '11：00〜22：00（Lo:21：30）' },
    { id: 5, label: '定休日', value: '毎週月曜日、隔週火曜日' },
    { id: 6, label: '電話番号', value: '0776-12-1234' },
]

const defaultPrimarySources: SourceItem[] = [
    { label: 'Instagram', url: 'https://www.instagram.com/', color: '#e69c7a' },
    { label: 'Facebook', url: '', color: '#e08a74' },
    { label: '食べログ', url: '', color: '#e8c4a8' },
    { label: 'ぐるなび', url: '', color: '#e6c9b7' },
    { label: 'Googleレビュー', url: '', color: '#e1b9a3' },
]

const defaultOtherSources: SourceItem[] = [
    { label: 'ふくいドット...', url: '' },
    { label: '青いろ', url: 'http://fuku-iro.jp/fecture/5' },
    { label: 'YouTube', url: 'https://www.youtube.com/' },
]

export default function Store() {
    const [primarySources, setPrimarySources] = useState<SourceItem[]>(defaultPrimarySources)
    const [otherSources, setOtherSources] = useState<SourceItem[]>(defaultOtherSources)
    const [menus, setMenus] = useState<MenuItem[]>([])
    const [showMoreMenus, setShowMoreMenus] = useState(false)
    const [logoPreview, setLogoPreview] = useState(Backup.src)
    const logoInputRef = useRef<HTMLInputElement | null>(null)

    const visibleMenus = useMemo(() => (showMoreMenus ? menus : menus.slice(0, 6)), [menus, showMoreMenus])
    const menuSlots = useMemo(() => Array.from({ length: 8 }, (_, i) => visibleMenus[i] ?? null), [visibleMenus])

    const handleAddPrimary = () => setPrimarySources((prev) => [...prev, { label: '新しい参照元', url: '' }])
    const handleAddOther = () => setOtherSources((prev) => [...prev, { label: '追加参照元', url: '' }])

    const handleSourceChange = (index: number, value: string, isPrimary = true) => {
        if (isPrimary) {
            const next = [...primarySources]
            next[index].url = value
            setPrimarySources(next)
        } else {
            const next = [...otherSources]
            next[index].url = value
            setOtherSources(next)
        }
    }

    const handleMenuUpload = (files: FileList | null) => {
        if (!files) return
        const list = Array.from(files).map((file) => ({
            id: `${file.name}-${file.lastModified}`,
            name: file.name,
            preview: URL.createObjectURL(file),
            ts: new Date().toLocaleString(),
        }))
        setMenus((prev) => [...prev, ...list])
    }

    const handleLogoSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setLogoPreview(URL.createObjectURL(file))
        }
        e.target.value = ''
    }

    return (
        <div className="page store-page">
            <header className="store-header">
                <h1 className="store-title">店舗AI 情報登録</h1>
                <div className="store">
                    <div>
                        <button
                            type="button"
                            className="basic-logo"
                            onClick={() => logoInputRef.current?.click()}
                            aria-label="ロゴをアップロード"
                        >
                            <img src={logoPreview} alt="ロゴ" /> 
                            {/* <div> ロゴ
                            </div> */}
                        </button>
                        <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleLogoSelect}
                        />
                    </div>

                    <div className='title-logo'>
                        <h2 className="section-title">基本情報</h2>

                    </div>
                </div>
            </header>

            <section className="store-section">
                <div className="basic-list">
                    {basicInfoFields.map((field) => (
                        <label key={field.id} className="basic-row">
                            <span className="basic-num">{field.id}</span>
                            <div className="basic-field">
                                <div>
                                    <span className="field-label">{field.label}</span>
                                </div>
                                <div>
                                    <input
                                        type={field.id === 2 ? 'url' : 'text'}
                                        className="form-input basic-input"
                                        defaultValue={field.value}
                                    />
                                </div>
                            </div>
                        </label>
                    ))}
                </div>
            </section>

            <section className="store-section">
                <h2 className="section-title">店舗情報 参照元</h2>
                <p className="section-note">最終更新：2025/10/1（水） 10：30</p>
                <div className="source-list">
                    {primarySources.map((src, idx) => (
                        <div key={src.label + idx} className="source-row primary">
                            <span className="source-num">{idx + 1}</span>
                            <span className="source-label" style={src.color ? { backgroundColor: src.color } : undefined}>
                                {src.label}
                            </span>
                            <input
                                className="source-input"
                                type="url"
                                value={src.url}
                                placeholder="https://"
                                onChange={(e) => handleSourceChange(idx, e.target.value, true)}
                            />
                        </div>
                    ))}
                </div>
                <button className="recommend-add" type="button" onClick={handleAddPrimary}>
                    参照元を追加
                </button>
            </section>

            <section className="store-section">
                <h2 className="section-title">その他参照元</h2>
                <div className="source-list">
                    {otherSources.map((src, idx) => (
                        <div key={src.label + idx} className="source-row">
                            <span className="source-num">{idx + 1}</span>
                            <span className="source-label light">{src.label}</span>
                            <input
                                className="source-input"
                                type="url"
                                value={src.url}
                                placeholder="https://"
                                onChange={(e) => handleSourceChange(idx, e.target.value, false)}
                            />
                        </div>
                    ))}
                </div>
                <button className="recommend-add" type="button" onClick={handleAddOther}>
                    参照元を追加
                </button>
            </section>

            <section className="store-section">
                <h2 className="section-title">その他ソース</h2>
                <div className="source-list">
                    <div className="source-row">
                        <span className="source-label light">チラシ</span>
                        <span className="source-note">ぽんたLINE友達追加キャンペーン</span>
                    </div>
                    <div className="source-row">
                        <span className="source-label light">チラシ</span>
                        <span className="source-note">ぽんたLINE友達追加キャンペーン</span>
                    </div>
                    <div className="source-row">
                        <span className="source-label light">ファイル</span>
                        <span className="source-note">ファイルをアップロード</span>
                    </div>
                </div>
            </section>

            <section className="store-section">
                <h2 className="section-title">メニュー/料理</h2>
                <p className="section-note">メニュー登録</p>
                <div className="upload-row">
                    <label className="upload-button">
                        <span>ファイルからアップロード</span>
                        <input type="file" accept="image/*" multiple onChange={(e) => handleMenuUpload(e.target.files)} />
                    </label>
                    <label className="upload-button">
                        <span>カメラで撮影</span>
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            multiple
                            onChange={(e) => handleMenuUpload(e.target.files)}
                        />
                    </label>
                </div>
                <div className="menu-grid">
                    {menuSlots.map((item, idx) => (
                        <div key={idx} className="menu-slot">
                            <span className="slot-num">{idx + 1}</span>
                            {item ? <img src={item.preview} alt={item.name} /> : <span className="slot-placeholder" />}
                        </div>
                    ))}
                </div>
                <div className="menu-updated">更新日：2025/10/1（水） 10：30</div>
                <button className="menu-more" type="button" onClick={() => setShowMoreMenus((v) => !v)}>
                    さらに表示
                </button>
            </section>

            <section className="store-section">
                <h2 className="section-title">おすすめメニュー</h2>
                <label className="recommend-row">
                    <input type="checkbox" defaultChecked />
                    <span>店舗AIにおススメを任せる</span>
                </label>
                <input className="form-input recommend-note" type="text" placeholder="おススメの指示があれば記載" />
                <div className="recommend-field">
                    <label className="field-label">おススメ品名</label>
                    <div className="recommend-search">
                        <input className="form-input" type="text" placeholder="" />
                        <span className="search-icon">🔍</span>
                    </div>
                </div>
                <div className="recommend-field">
                    <label className="field-label">おススメコメント</label>
                    <input className="form-input" type="text" placeholder="おススメのコメントがあれば記載" />
                </div>
                <div className="menu-updated">更新日：2025/10/1（水） 10：30</div>
                <button className="recommend-add" type="button">
                    ＋ おススメを追加
                </button>
            </section>

            <section className="store-section">
                <h2 className="section-title">人気のメニュー</h2>
                <label className="recommend-row">
                    <input type="checkbox" defaultChecked />
                    <span>店舗AIに選定を任せる</span>
                </label>
                <input className="form-input recommend-note" type="text" placeholder="人気のメニューの指示があれば記載" />
                <div className="recommend-field">
                    <label className="field-label">人気メニュー品名</label>
                    <div className="recommend-search">
                        <input className="form-input" type="text" placeholder="" />
                        <span className="search-icon">🔍</span>
                    </div>
                </div>
                <div className="recommend-field">
                    <label className="field-label">人気メニューコメント</label>
                    <input className="form-input" type="text" placeholder="おススメのコメントがあれば記載" />
                </div>
                <div className="menu-updated">更新日：2025/10/1（水） 10：30</div>
                <button className="recommend-add" type="button">
                    ＋ 人気のメニューを追加
                </button>
            </section>

            <section className="store-section">
                <h2 className="section-title">質問チップ</h2>
                <label className="recommend-row">
                    <input type="checkbox" defaultChecked />
                    <span>店舗AIに選定を任せる</span>
                </label>
                <div className="question-list">
                    {['人気のメニューは？', '今日のおすすめ', 'メニュー表', '周辺の観光地'].map((q) => (
                        <input key={q} className="form-input question-input" type="text" defaultValue={q} />
                    ))}
                </div>
                <button className="recommend-add" type="button">
                    ＋ 質問チップを追加
                </button>
            </section>

            <section className="store-section">
                <h2 className="section-title">おすすめ商品リンク設定</h2>
                <label className="recommend-row">
                    <input type="checkbox" defaultChecked />
                    <span>関連商品リンクを生成する</span>
                </label>
                <label className="recommend-row">
                    <input type="checkbox" defaultChecked />
                    <span>店舗AIに選定を任せる</span>
                </label>
                {[1, 2, 3, 4].map((idx) => (
                    <div key={idx} className="product-row">
                        <label className="field-label">商品名</label>
                        <input className="form-input product-input" type="text" placeholder="" />
                        <label className="field-label">リンク</label>
                        <input className="form-input product-input" type="url" placeholder="" />
                    </div>
                ))}
            </section>
        </div>
    )
}
