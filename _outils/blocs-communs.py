#!/usr/bin/env python3
"""Recopie l'en-tête et le pied de page communs (_outils/entete.html, _outils/pied.html) dans toutes
les pages du site, entre les repères <!-- debut:entete --> … <!-- fin:entete --> et
<!-- debut:pied --> … <!-- fin:pied -->. Marque aussi le lien de la page courante (aria-current).
Usage : python3 _outils/blocs-communs.py   (depuis la racine du dépôt du site)"""
import pathlib, re

racine = pathlib.Path(__file__).resolve().parent.parent
outils = racine / '_outils'
blocs = {nom: (outils / f'{nom}.html').read_text(encoding='utf-8').rstrip('\n') for nom in ('entete', 'pied')}

for page in sorted(racine.rglob('*.html')):
    if outils in page.parents:
        continue
    texte = page.read_text(encoding='utf-8')
    chemin = '/' + str(page.parent.relative_to(racine)).replace('.', '').strip('/') + '/'
    chemin = chemin.replace('//', '/')
    for nom, contenu in blocs.items():
        if nom == 'entete':
            contenu = contenu.replace(f'<a href="{chemin}">', f'<a href="{chemin}" aria-current="page">') if chemin != '/' else contenu
        motif = re.compile(rf'(<!-- debut:{nom} -->)\n.*?\n(\s*<!-- fin:{nom} -->)', re.S)
        if not motif.search(texte):
            continue
        texte = motif.sub(lambda m: f'{m.group(1)}\n  {contenu}\n{m.group(2)}', texte)
    page.write_text(texte, encoding='utf-8')
    print('à jour :', page.relative_to(racine))
