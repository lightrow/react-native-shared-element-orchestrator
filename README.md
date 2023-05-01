# Shared Transition Orchestrator 

A helper library for [react-native-shared-element](https://github.com/IjzerenHein/react-native-shared-element). Works as a standalone animator or can be coupled with any navigation library.

[![npm](https://img.shields.io/npm/v/react-native-shared-element-orchestrator?style=for-the-badge)](https://www.npmjs.com/package/react-native-shared-element-orchestrator)

# How it works


When new scene becomes active, orchestrator will check if there are matching shared elements (by ids) between new scene and previously active scene. For each found element it will create a transition. Additionally the scenes can animate themselves during scene transition (using `sceneInterpolator` prop). When scene is deactivated, orchestrator will try to find the previously active scene, and repeat the same process.
<br>
<br>

<img src="./example/example.gif" width="278" height="600" style="margin:30px auto;display:block"/>

### `SharedTransitionOrchestrator`

Provides context for scenes, observes scenes changes, renders transitions between scenes. By default it stretches to parent container, as it is meant to be inserted somewhere at the root app level, but it can also be placed somewhere else and styled accordingly.

| `Props`            |                                                                                  |
| ------------------ | -------------------------------------------------------------------------------- |
| `style?`           | _default_ **`{...StyleSheet.absoluteFillObject, zIndex: 99999999}`**             |
| `duration?`        | _default_ **`500`**<br> Scene transition duration.                               |
| `easing?`          | _default_ **`Easing.out(Easing.exp)`**<br>Scene transition easing function.      |
| `useNativeDriver?` | _default_ **`true`**<br> Change to false if your style interpolators require it. |

<br>

### `SharedTransitionScene`

Provides context for elements, observes elements changes, optionally animates itself during scene transitions

| `Props`              |                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `style?`             | _default_ **`undefined`**<br> Outer View style.                                                                                                                                                                                                                                                                                                                                                                 |
| `containerStyle?`    | _default_ **`undefined`**<br> Inner View style, `sceneInterpolator` applies to this one.                                                                                                                                                                                                                                                                                                                        |
| `isActive?`          | _default_ **`false`**<br><br> `true` - Scene is added to the top of the active scenes stack.<br>`false` - Scene is removed from the active scenes stack.<br><br> Changing this value will trigger Orchestrator search for previous scene and matching elements to run transitions. Normally this stays `true` for all Scenes, and is flipped to `false` before Scene is unmounted to trigger reverse animations |
| `sceneInterpolator?` | _default_ **`undefined`**<br>Allows animating Scene transitions, e.g: <br> `sceneInterpolator={(progress) => ({ opacity: progress })}`                                                                                                                                                                                                                                                                          |

<br>

### `SharedTransitionElement`

Wraps the views you want to apply shared transition to.

| `Props`  |                                                              |
| -------- | ------------------------------------------------------------ |
| `id`     | _required_ <br> ID used for matching Elements between Scenes |
| `style?` | _default_ **`undefined`**<br> View style.                    |

<br>

# How to use /// WIP

```sh
npm i react-native-shared-element react-native-shared-element-orchestrator

# if iOS

cd ios
pod install
```

```tsx
const App = () => {
  ...
  return (
      <SharedTransitionOrchestrator>
        <Gallery .../>
        {selectedMedia && <MediaViewer .../>}
      </SharedTransitionOrchestrator>
  )
}

const Gallery = () => {
  return (
    <SharedTransitionScene isActive>
      {media.map(mediaUrl => {
        return (
          <SharedTransitionElement id={mediaUrl}>
            ...
          </SharedTransitionElement>
        )
      })}
    </SharedTransitionScene>
  )
}

const MediaViewer = () => {
  const [isActive, setIsActive] = useState(true);

  const dismiss = async () => {
    setIsActive(false);
    setTimeout(() => {
      // allow view to close with transition before unmounting
      clearSelectedMedia();
    }, ANIMATION_DURATION)
  }

  return (
    <SharedTransitionScene
      sceneInterpolator={(progress) => ({ opacity: progress })}
      isActive={isActive}
      style={{
        backgroundColor: 'black',
        ...StyleSheet.absoluteFillObject
      }}
    >
      <SharedTransitionElement id={selectedMediaUrl}>
        ...
      </SharedTransitionElement>
    </SharedTransitionScene>
  )
}
```

Usage with navigation libraries is also possible. Scenes can be placed inside screens, and `sceneInterpolator` can be left empty. `isActive` can then be toggled off when the screen is being popped out of the screen stack, e.g. _`beforeRemove`_ event in React Navigation
