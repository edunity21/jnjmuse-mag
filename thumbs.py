from PIL import Image
H=320
pairs={'s04':[4,5],'s06':[6,7],'s08':[8,9],'s10':[10,11],'s12':[12,13],'s14':[14],'s15':[15,16],'s17':[17],'s18':[18,19],'s20':[20]}
for k,ps in pairs.items():
    ims=[Image.open(f'shots/p{n:02d}.png').convert('RGB') for n in ps]
    ims=[im.resize((round(im.width*H/im.height),H),Image.LANCZOS) for im in ims]
    W=sum(i.width for i in ims)+(len(ims)-1)*2
    sh=Image.new('RGB',(W,H),'#dddddd'); x=0
    for im in ims: sh.paste(im,(x,0)); x+=im.width+2
    sh.save(f'thumbs/{k}.png',optimize=True)
print('ok')
