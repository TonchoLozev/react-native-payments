
/** @light styles - base style **/
const light = {
  default: {
    backgroundColor: lightColor('grey:900'),
  },
  pressed: {
    backgroundColor: lightColor('grey:800'),
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
  },
  text: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignContent: 'center',
  },
  image: {
    marginLeft: space('xs2'),
  },
};
/** @dark styles - override what’s needed only **/
const dark = {
  text: {
    color: darkColor('black'),
  },
  default: {
    backgroundColor: darkColor('white'),
  },
  pressed: {
    backgroundColor: darkColor('grey:200'),
  },
};
export const lightStyles = createStyleSheet(light);
export const darkStyles = createStyleSheet(light, dark);
