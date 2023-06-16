// import { runSample } from '@/lib/blockly/blocks/preBlock'

import pureCanvas from './pureCanvas'
import runSample from './runSample'

export default {
  pureCanvas: JSON.stringify(pureCanvas),
  // runSample: JSON.stringify(runSample),
  // runSample: ['function x() {', '\tconsole.log("Hello world!");', '}'].join('\n'),
  runSample: `
const Color = {RED: '0xFF0000',ORANGE: '0xFF8C00',YELLOW: '0xFFFF00',GREEN: '0x00FF00',BLUE: '0x0000FF',PURPLE: '0x510099',PINK: '0xFF0a27',WHITE: '0xFFFFFF' }
const Music = { WIN: 'gwin', WRONG: 'olwh', BEGIN: 'gbeg', BEGIN2: 'stat', COUNT_DOWN: 'tend', COUNT_LAST: 'tala', MOVE_1: 'mov1', MOVE_2: 'mov2', MOVE_3: 'mov3', MOVE_4: 'mov4', MOVE_5: 'mov5', MATCH_1: 'mat1', MATCH_2: 'mat2', MATCH_3: 'mat3', MATCH_4: 'mat4', MATCH_5: 'mat5', FIND_TARGET: 'fhed', FIND_NOTHING: 'fnon', FIND_CHECK: 'chek', DO: '01do', RE: '02re',  MI: '03mi', FA: '04fa', SO: '05so', LA: '06la', XI: '07xi' }
_setColor(Color.WHITE)
function When_JOYO_Read(val) {
  _playMusic(Music.WIN)
}
  `,
}
