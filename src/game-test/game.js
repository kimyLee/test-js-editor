var value, number, input_value, read_value, player_id, target_len_for_player, current_node, link, random_temp_list, current_scanned, player_scanned, target_len, is_other_target, k, temp, scan_again_flag, players, n, map, i, player1, player2, player3, player4, is_all_right, player5, j, player6;


function When_JOYO_Read(value) {
  if (scan_again_flag == 1) {
    handle_scan_again(value);
  } else {
    // when joyo read start maker
    if (value >= 41 && value <= 46) {
      clearAllLight();
      blePlayMusic("mov5");
      sleepFn(0.3);
      init_player(value - 40);
    }
    // when joyo read the identify
    if (value >= 49 && value <= 54) {
      when_read_indentify(value - 48);
    }
    // when JOYO scan the dots
    if (value >= 1 && value <= 36) {
      handle_scan_dots(value);
    }
  }
}

function listsRepeat(value, n) {
  var array = [];
  for (var i = 0; i < n; i++) {
    array[i] = value;
  }
  return array;
}

// init and generate target by the player number
function init_player(number) {
  bleSetLightAnimation('run', 0, 0xffffff);
  target_len = target_len_for_player[(number - 1)];
  players = listsRepeat([], number);
  player_scanned = listsRepeat([], number);
  var i_inc = 1;
  if (1 > number) {
    i_inc = -i_inc;
  }
  for (i = 1; i_inc >= 0 ? i <= number : i >= number; i += i_inc) {
    players[(i - 1)] = generate_target();
    link = [];
  }
  blePlayMusic("gbeg");
  // just for debug, without logic
  print("players", JSON.stringify(players));
  sleepFn(0.5);
  clearAllLight();
  sleepFn(0.5);
  // blue
  bleSetLight(JSON.stringify({colors:[255,255,255,255,255,255,255,255,255,255,255,255],bright:1}));
}

// check good or not when scan the dots
function handle_scan_dots(input_value) {
  if (link.indexOf(input_value) >= 0) {
    // green
    bleSetLight(JSON.stringify({colors:[65280,65280,65280,65280,65280,65280,65280,65280,65280,65280,65280,65280],bright:1}));
    blePlayMusic("03mi");
    // if current player have not collect the dots yet, just collect it
    if (current_scanned != null && !(current_scanned.indexOf(input_value) >= 0)) {
      current_scanned[((current_scanned.length + 1) - 1)] = input_value;
    }
    // he has collect all, ask player to scan one more
    if (current_scanned.length >= target_len) {
      sleepFn(0.5);
      // blue
      bleSetLight(JSON.stringify({colors:[255,255,255,255,255,255,255,255,255,255,255,255],bright:1}));
      sleepFn(1);
      blePlayMusic("fhed");
      scan_again_flag = 1;
      temp = [];
    }
    print("current_scanned", JSON.stringify(current_scanned));
  } else {
    is_other_target = 0;
    for (var n_index in players) {
      n = players[n_index];
      if (n.indexOf(input_value) >= 0) {
        bleSetLight(JSON.stringify({colors:[16776960,16776960,16776960,16776960,16776960,16776960,16776960,16776960,16776960,16776960,16776960,16776960],bright:1}));
        blePlayMusic("olwh");
        is_other_target = 1;
      }
    }
    if (is_other_target == 0) {
      bleSetLight(JSON.stringify({colors:[16711680,16711680,16711680,16711680,16711680,16711680,16711680,16711680,16711680,16711680,16711680,16711680],bright:1}));
      blePlayMusic("olwh");
    }
  }
}

function mathRandomInt(a, b) {
  if (a > b) {
    // Swap a and b to ensure a is smaller.
    var c = a;
    a = b;
    b = c;
  }
  return Math.floor(Math.random() * (b - a + 1) + a);
}

// Describe this function...
function generate_target() {
  current_node = mathRandomInt(1, 36);
  print("current_node", JSON.stringify(current_node));
  link[0] = current_node;
  while (link.length < target_len) {
    random_next_node();
  }
  return link;
}

function listsGetRandomItem(list, remove) {
  var x = Math.floor(Math.random() * list.length);
  if (remove) {
    return list.splice(x, 1)[0];
  } else {
    return list[x];
  }
}

// repeat get target node
function random_next_node() {
  random_temp_list = [];
  var k_list = map[(current_node - 1)];
  for (var k_index in k_list) {
    k = k_list[k_index];
    if (!(link.indexOf(k) >= 0)) {
      random_temp_list[((random_temp_list.length + 1) - 1)] = k;
    }
  }
  temp = listsGetRandomItem(random_temp_list, false);
  print("temp", JSON.stringify(temp));
  link[((link.length + 1) - 1)] = temp;
  current_node = temp;
}

// do something when player collect all and need to scan again
function handle_scan_again(read_value) {
  // when JOYO scan the dots
  if (read_value >= 1 && read_value <= 36) {
    if (!(temp.indexOf(read_value) >= 0)) {
      bleSetLight(JSON.stringify({colors:[16777215,16777215,16777215,16777215,16777215,16777215,16777215,16777215,16777215,16777215,16777215,16777215],bright:1}));
      blePlayMusic("01do");
      print((temp.length));
      temp[((temp.length + 1) - 1)] = read_value;
      print("temp", JSON.stringify(temp));
      if (temp.length == target_len) {
        is_all_right = 1;
        var j_inc = 1;
        if (1 > target_len) {
          j_inc = -j_inc;
        }
        for (j = 1; j_inc >= 0 ? j <= target_len : j >= target_len; j += j_inc) {
          if (link.indexOf(temp[(j - 1)]) + 1 < 1) {
            is_all_right = 0;
          }
        }
        if (is_all_right == 1) {
          bleSetLightAnimation('run', 0, 0x00ff00);
          blePlayMusic("gwin");
        } else {
          bleSetLight(JSON.stringify({colors:[16711680,16711680,16711680,16711680,16711680,16711680,16711680,16711680,16711680,16711680,16711680,16711680],bright:1}));
          sleepFn(0.2);
          blePlayMusic("olwh");
        }
        scan_again_flag = 0;
        temp = [];
      }
    }
  }
}

// when JOYO read the player identify
function when_read_indentify(player_id) {
  current_scanned = null;
  sleepFn(0.3);
  if (player_id == 1) {
    current_scanned = player1;
  }
  if (player_id == 2) {
    current_scanned = player2;
  }
  if (player_id == 3) {
    current_scanned = player3;
  }
  if (player_id == 4) {
    current_scanned = player4;
  }
  if (player_id == 5) {
    current_scanned = player5;
  }
  if (player_id == 6) {
    current_scanned = player6;
  }
  link = players[(player_id - 1)];
  blePlayMusic("mov5");
  print("current_scanned", JSON.stringify(current_scanned));
}


function setUp() {
  // config the game target number with different player
  target_len_for_player = [24, 12, 8, 6, 5, 4];
  current_scanned = null;
  temp = [];
  scan_again_flag = 0;
  link = [];
  player1 = [];
  player2 = [];
  player3 = [];
  player4 = [];
  player5 = [];
  player6 = [];
  map = [[2, 8], [1, 3, 8, 9], [2, 4], [3, 5, 9, 10], [4, 6], [5, 11], [8, 13], [1, 2, 7, 10], [2, 4], [4, 8, 11, 15, 16, 17], [6, 10, 12, 17], [11, 18], [7, 14], [13, 19], [8, 10, 16, 20], [10, 15, 17, 21], [10, 11, 16, 18, 22, 29], [12, 17, 23, 24], [14, 20, 25, 26], [8, 19, 15, 21, 26, 27], [16, 20, 22, 27], [17, 21, 27, 29], [18, 29], [18, 30], [19, 31], [19, 20, 27, 33], [20, 21, 22, 26, 29, 33], [29, 35], [17, 23, 22, 27, 28, 35], [24, 36], [25, 32], [31, 33], [26, 27, 32, 34], [33, 35], [28, 29, 34, 36], [30, 35]];
}
setUp();

player_scanned[(player_id - 1)];