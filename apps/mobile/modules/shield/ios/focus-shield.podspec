Pod::Spec.new do |s|
  s.name           = 'focus-shield'
  s.version        = '0.0.1'
  s.summary        = 'Native app-blocking shield for Focus (iOS stub, Android implementation)'
  s.description    = 'iOS stub for the Focus Shield native module. Real enforcement is Android-only.'
  s.author         = ''
  s.homepage       = 'https://github.com/YogaDharma21/focus'
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = 'ios/**/*.{h,m,mm,swift}'
end
