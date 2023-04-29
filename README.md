# Shared Transition Orchestrator

A helper library for react-native-shared-element. Works as a standalone animator or can be coupled with any navigation library.

# How it works

### SharedTransitionOrchestrator

Provides context for scenes, observes scenes changes, renders transitions between scenes

### SharedTransitionScene

Provides scene state for elements, observes elements changes, optionally animates itself during scene transitions

### SharedTransitionElement

Wraps the views you want to animate between scenes.

### Process

When new scene becomes active, orchestrator will check if there are matching shared elements (by ids) between new scene and previously active scene. For each found element it will create a transition. Additionally the scenes can also animate themselves during element transition (e.g. fade in, slide out, etc). When scene is deactivated ( isActive={false} ), orchestrator will try to find the previously active scene, and do the same process.

Elements ids can be set dynamically, e.g. a gallery masonry view and a fullscreen carousel view contain same images, but you only want to animate the one that was tapped - set the id of unwanted images to some dummy string that doesn't exist in the previous scene.

# How to use /// WIP

## With navigator

Note: SharedTransitionScene and SharedTransitionElement are Views and should be styled accordingly (omitted here)

```
const App = () => {
  return (
    <...>
      <SharedTransitionOrchestrator>
        <SomeNavigator/>
      </SharedTransitionOrchestrator>
    <...>
  )
}

const SomeNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="GalleryScreen" component={GalleryScreen}/>
      <Stack.Screen name="MediaViewerScreen" component={MediaViewerScreen}/>
    </Stack.Navigator>
  )
}

const GalleryScreen = () => {
  return (
    <SharedTransitionScene isActive>
      <ScrollView>
        {media.map(mediaUrl => {
          return (
            <Touchable
              onPress={() => Navigation.goToMediaViewer(mediaUrl)}
            >
              <SharedTransitionElement id={mediaUrl}>
                <Image src={{ uri: mediaUrl }}>
              </SharedTransitionElement>
            </Touchable>
          )
        })}
      </ScrollView>
    </SharedTransitionScene>
  )
}

const MediaViewerScreen = () => {
  const isFocused = useIsFocused();

  const {
    params: { mediaUrl },
  } = useRoute()

  return (
    <SharedTransitionScene isActive={isFocused}>
      <Touchable
        onPress={Navigation.goBack}
      >
        <SharedTransitionElement id={mediaUrl}>
          <Image src={{ uri: mediaUrl }}>
        </SharedTransitionElement>
      </Touchable>
    </SharedTransitionScene>
  )
}
```

## Without navigator (with scene animation)

```
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
