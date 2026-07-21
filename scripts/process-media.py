#!/usr/bin/env python3
import argparse, json, mimetypes, os, sys
from pathlib import Path
from PIL import Image, ImageOps, features

MIME={'JPEG':'image/jpeg','PNG':'image/png','WEBP':'image/webp','AVIF':'image/avif','TIFF':'image/tiff'}
def inspect_image(path):
    p=Path(path)
    with Image.open(p) as im:
        exif=im.getexif(); keys=[]
        if exif:
            keys.extend([f'exif:{k}' for k in exif.keys()])
        for key in im.info:
            if key.lower() in {'exif','xmp','iptc','comment','description','xml','photoshop'}: keys.append(key)
        return {'format':im.format,'mime':MIME.get(im.format,mimetypes.guess_type(p.name)[0] or 'application/octet-stream'),'width':im.width,'height':im.height,'bytes':p.stat().st_size,'has_exif':bool(exif or 'exif' in im.info),'metadata_keys':sorted(set(keys))}

def crop(image,width,height,fit,focus):
    if fit=='cover':
        return ImageOps.fit(image,(width,height),method=Image.Resampling.LANCZOS,centering=focus)
    if fit=='contain':
        canvas=Image.new('RGB',(width,height),(232,228,216)); copy=image.copy();copy.thumbnail((width,height),Image.Resampling.LANCZOS);canvas.paste(copy,((width-copy.width)//2,(height-copy.height)//2));return canvas
    copy=image.copy();copy.thumbnail((width,height),Image.Resampling.LANCZOS);return copy

def process(args, emit=True):
    with Image.open(args.source) as raw:
        image=ImageOps.exif_transpose(raw).convert('RGB')
        result=crop(image,args.width,args.height,args.fit,(args.focus_x,args.focus_y))
        output=Path(args.output);output.parent.mkdir(parents=True,exist_ok=True)
        options={}
        if args.format=='avif': options={'format':'AVIF','quality':58,'speed':10}
        elif args.format=='webp': options={'format':'WEBP','quality':78,'method':5}
        elif args.format=='jpeg': options={'format':'JPEG','quality':84,'optimize':True,'progressive':True,'subsampling':'4:2:0'}
        else: raise ValueError('Formato de saída inválido')
        result.save(output,**options)
    inspection=inspect_image(output)
    if emit: print(json.dumps(inspection,ensure_ascii=False))
    return inspection

def process_item(source, item):
    class Args: pass
    args=Args();args.source=source;args.output=item['output'];args.width=int(item['width']);args.height=int(item['height']);args.fit=item['fit'];args.format=item['format'];args.focus_x=float(item.get('focus_x',.5));args.focus_y=float(item.get('focus_y',.5))
    return process(args, emit=False)

def main():
    parser=argparse.ArgumentParser(); sub=parser.add_subparsers(dest='command',required=True)
    ins=sub.add_parser('inspect');ins.add_argument('--source',required=True)
    sub.add_parser('inspect-batch')
    pro=sub.add_parser('process');pro.add_argument('--source',required=True);pro.add_argument('--output',required=True);pro.add_argument('--width',type=int,required=True);pro.add_argument('--height',type=int,required=True);pro.add_argument('--fit',choices=['cover','contain','inside'],required=True);pro.add_argument('--format',choices=['avif','webp','jpeg'],required=True);pro.add_argument('--focus-x',type=float,default=.5);pro.add_argument('--focus-y',type=float,default=.5)
    sub.add_parser('batch')
    args=parser.parse_args()
    if args.command=='inspect': print(json.dumps(inspect_image(args.source),ensure_ascii=False))
    elif args.command=='inspect-batch':
        payload=json.load(sys.stdin);print(json.dumps([inspect_image(p) for p in payload['sources']],ensure_ascii=False))
    elif args.command=='batch':
        payload=json.load(sys.stdin);results=[]
        for item in payload['items']:
            if item['format']=='avif' and not features.check('avif'): raise RuntimeError('Pillow sem suporte AVIF')
            if item['format']=='webp' and not features.check('webp'): raise RuntimeError('Pillow sem suporte WebP')
            results.append(process_item(payload['source'],item))
        print(json.dumps(results,ensure_ascii=False))
    else:
        if args.format=='avif' and not features.check('avif'): raise RuntimeError('Pillow sem suporte AVIF')
        if args.format=='webp' and not features.check('webp'): raise RuntimeError('Pillow sem suporte WebP')
        process(args)
if __name__=='__main__':
    try: main()
    except Exception as exc:
        print(f'SUBSOLO_MEDIA_PROCESSOR_ERROR: {exc}',file=sys.stderr);sys.exit(2)
