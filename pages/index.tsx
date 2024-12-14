import { Fragment } from 'react';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Center,
  Container,
  Grid,
  Loader,
  Text,
  Paper,
  Stack,
  Title,
  Group,
  Tooltip,
  ThemeIcon,
  SimpleGrid,
  Card,
  Badge,
  ActionIcon,
  useMantineColorScheme,
} from '@mantine/core';
import { AudioRecorder } from 'react-audio-voice-recorder';
import {
  IconAlertCircle,
  IconFlower,
  IconMicrophone,
  IconRefresh,
  IconRobot,
  IconUser,
  IconBrain,
  IconMicrophone2,
  IconLanguage,
  IconSettings,
  IconSun,
  IconMoonStars,
} from '@tabler/icons-react';
import type { Icon } from '@tabler/icons-react';

interface MessageSchema {
  role: 'assistant' | 'user' | 'system';
  content: string;
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messagesArray, setMessagesArray] = useState<MessageSchema[]>([]);
  const [showMessages, setShowMessages] = useState(false);
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  useEffect(() => {
    if (messagesArray[messagesArray.length - 1]?.role === 'user') {
      gptRequest();
    }
  }, [messagesArray]);

  // gpt request
  const gptRequest = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('messagesArray in gptRequest fn', messagesArray);
      const response = await fetch('/api/chatgpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: messagesArray,
        }),
      });

      const gptResponse = await response.json();
      setLoading(false);
      
      if (response.status === 429 || gptResponse.error?.code === 'insufficient_quota') {
        setError('OpenAI API credit limit reached. Please try again later or contact the administrator.');
        return;
      }

      if (gptResponse.content) {
        setMessagesArray((prevState) => [...prevState, gptResponse]);
      } else {
        setError('No response returned from server.');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setLoading(false);
        if (error.message.includes('quota') || error.message.includes('credit')) {
          setError('OpenAI API credit limit reached. Please try again later or contact the administrator.');
        } else {
          setError('An error occurred while processing your request.');
        }
        console.error('Error:', error);
      }
    }
  };

  const updateMessagesArray = (newMessage: string) => {
    const newMessageSchema: MessageSchema = {
      role: 'user',
      content: newMessage,
    };
    setMessagesArray((prevState) => [...prevState, newMessageSchema]);
  };

  // whisper request
  const whisperRequest = async (audioFile: Blob) => {
    setError(null);
    setLoading(true);
    const formData = new FormData();
    formData.append('file', audioFile, 'audio.wav');
    
    try {
      const response = await fetch('/api/whisper', {
        method: 'POST',
        body: formData,
      });
  
      let jsonResponse;
      try {
        jsonResponse = await response.json(); // Attempt to parse JSON
      } catch (jsonError) {
        throw new Error('Failed to parse server response.'); // Handle non-JSON responses
      }
  
      if (response.status === 429 || jsonResponse.error?.code === 'insufficient_quota') {
        setError('OpenAI API credit limit reached. Please try again later or contact the administrator.');
        return;
      }
  
      if (response.ok) {
        const { text } = jsonResponse;
        updateMessagesArray(text);
      } else {
        const errorMessage = jsonResponse?.error?.message || 'An unknown error occurred.';
        setError(errorMessage);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('credit')) {
          setError('OpenAI API credit limit reached. Please try again later or contact the administrator.');
        } else {
          setError('An error occurred while processing your request.');
        }
        console.error('Error:', error);
      }
    } finally {
      setLoading(false);
    }
  };
  

  // Add error boundary for API errors
  const handleApiError = (error: unknown) => {
    setLoading(false);
    if (error instanceof Error) {
      if (error.message.includes('quota') || error.message.includes('credit')) {
        setError('OpenAI API credit limit reached. Please try again later or contact the administrator.');
      } else {
        setError('An error occurred while processing your request.');
      }
    } else {
      setError('An unexpected error occurred.');
    }
    console.error('Error:', error);
  };

  return (
    <Fragment>
      <Head>
        <title>AI Voice Assistant</title>
        <meta name="description" content="AI-powered voice assistant using GPT-3.5 and Whisper" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Container 
        size="md" 
        pt={50} 
        pb={100}
        sx={(theme) => ({
          [theme.fn.smallerThan('sm')]: {
            padding: '20px 10px',
          },
        })}
      >
        <Stack 
          spacing={40} 
          sx={(theme) => ({
            [theme.fn.smallerThan('sm')]: {
              gap: '20px',
            },
          })}
        >
          {/* Hero Section */}
          <Group 
            position="center" 
            spacing={5}
            sx={(theme) => ({
              [theme.fn.smallerThan('sm')]: {
                flexDirection: 'column',
                textAlign: 'center',
              },
            })}
          >
            <Paper
              radius="xl"
              p="md"
              sx={(theme) => ({
                background: theme.fn.linearGradient(45, '#00F5A0', '#00D9F5'),
              })}
            >
              <Box 
                sx={(theme) => ({
                  [theme.fn.smallerThan('sm')]: {
                    transform: 'scale(0.75)',
                  }
                })}
              >
                <IconRobot 
                  size={40} 
                  color="white" 
                />
              </Box>
            </Paper>
            <Title
              order={1}
              sx={(theme) => ({
                fontSize: '3.5rem', 
                fontWeight: 900,
                background: theme.fn.linearGradient(45, '#00F5A0', '#00D9F5'),
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                [theme.fn.smallerThan('sm')]: {
                  fontSize: '2rem',
                },
              })}
            >
              AI-Powered Voice Assistant
            </Title>
          </Group>

          {/* Features Section */}
          <SimpleGrid
            cols={3}
            spacing="xl"
            breakpoints={[
              { maxWidth: 'md', cols: 2 },
              { maxWidth: 'sm', cols: 1 },
            ]}
          >
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Card.Section p="md">
                <ThemeIcon
                  size={50}
                  radius="md"
                  variant="gradient"
                  gradient={{ from: '#00F5A0', to: '#00D9F5' }}
                >
                  <IconBrain size={26} />
                </ThemeIcon>
              </Card.Section>
              <Text size="lg" weight={500} mt="sm">
                AI-Powered Conversations
              </Text>
              <Text size="sm" color="dimmed" mt="xs">
                Powered by GPT-3.5 for intelligent, context-aware responses
              </Text>
            </Card>

            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Card.Section p="md">
                <ThemeIcon
                  size={50}
                  radius="md"
                  variant="gradient"
                  gradient={{ from: '#00F5A0', to: '#00D9F5' }}
                >
                  <IconMicrophone2 size={26} />
                </ThemeIcon>
              </Card.Section>
              <Text size="lg" weight={500} mt="sm">
                Voice Recognition
              </Text>
              <Text size="sm" color="dimmed" mt="xs">
                Advanced speech-to-text powered by Whisper AI
              </Text>
            </Card>

            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Card.Section p="md">
                <ThemeIcon
                  size={50}
                  radius="md"
                  variant="gradient"
                  gradient={{ from: '#00F5A0', to: '#00D9F5' }}
                >
                  <IconLanguage size={26} />
                </ThemeIcon>
              </Card.Section>
              <Text size="lg" weight={500} mt="sm">
                Multilingual Support
              </Text>
              <Text size="sm" color="dimmed" mt="xs">
                Communicate in multiple languages seamlessly
              </Text>
            </Card>
          </SimpleGrid>

          {/* Main Content */}
          <Paper
            radius="lg"
            p={{ base: 'md', sm: 40 }}
            sx={(theme) => ({
              backgroundColor: theme.colorScheme === 'dark' 
                ? theme.fn.rgba(theme.colors.dark[8], 0.95)
                : theme.fn.rgba(theme.white, 0.98),
              backdropFilter: 'blur(12px)',
              border: `1px solid ${
                theme.colorScheme === 'dark'
                  ? theme.fn.rgba(theme.colors.dark[4], 0.3)
                  : theme.fn.rgba(theme.colors.gray[2], 0.3)
              }`,
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: theme.fn.linearGradient(45, '#00F5A0', '#00D9F5'),
              },
            })}
          >
            <Stack spacing={24}>
              {/* Messages Section */}
              {messagesArray.length > 0 && (
                <Paper
                  radius="md"
                  p={{ base: 'md', sm: 'xl' }}
                  sx={(theme) => ({
                    maxHeight: '400px',
                    overflowY: 'auto',
                    backgroundColor: theme.colorScheme === 'dark'
                      ? theme.fn.rgba(theme.colors.dark[9], 0.95)
                      : theme.fn.rgba(theme.colors.gray[0], 0.3),
                    border: `1px solid ${
                      theme.colorScheme === 'dark'
                        ? theme.fn.rgba(theme.colors.dark[4], 0.2)
                        : theme.fn.rgba(theme.colors.gray[2], 0.2)
                    }`,
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: theme.fn.linearGradient(45, '#00F5A0', '#00D9F5'),
                      borderRadius: '4px',
                    },
                  })}
                >
                  <Stack spacing="md">
                    {messagesArray.map((message, index) => (
                      <Paper
                        key={index}
                        p={{ base: 'sm', sm: 'md' }}
                        radius="md"
                        sx={(theme) => ({
                          background: message.role === 'user'
                            ? theme.fn.linearGradient(45, '#00F5A0', '#00D9F5')
                            : theme.colorScheme === 'dark' 
                              ? theme.fn.rgba(theme.colors.dark[8], 0.95)  // Dark mode: dark background
                              : theme.white,  // Light mode: white background
                          color: message.role === 'user' 
                            ? 'white'  // User messages always white
                            : theme.colorScheme === 'dark'
                              ? 'white'  // AI messages in dark mode: white text
                              : theme.colors.dark[9],  // AI messages in light mode: dark text
                          boxShadow: theme.shadows.sm,
                          marginLeft: message.role === 'user' ? 'auto' : 0,
                          marginRight: message.role === 'system' ? 'auto' : 0,
                          maxWidth: '90%',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                          },
                          [theme.fn.smallerThan('sm')]: {
                            maxWidth: '95%',
                          },
                        })}
                      >
                        <Group spacing="xs" align="center">
                          {message.role === 'user' ? (
                            <IconUser size={16} color="white" style={{ opacity: 0.8 }} />
                          ) : (
                            <IconRobot 
                              size={16} 
                              color={colorScheme === 'dark' ? 'white' : '#333'} 
                              style={{ opacity: 0.8 }}
                            />
                          )}
                          <Text 
                            size="sm"
                            sx={(theme) => ({
                              [theme.fn.largerThan('sm')]: {
                                fontSize: theme.fontSizes.md,
                              },
                            })}
                            weight={500}
                          >
                            {message.content}
                          </Text>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                </Paper>
              )}

              {/* Empty State - Show when no messages */}
              {messagesArray.length === 0 && (
                <Box
                  sx={(theme) => ({
                    textAlign: 'center',
                    padding: `${theme.spacing.xl * 2}px`,
                    color: theme.colors.gray[6],
                  })}
                >
                  <IconMicrophone2 size={40} stroke={1.5} />
                  <Text size="lg" weight={500} mt="md">
                    Start Speaking
                  </Text>
                  <Text size="sm" color="dimmed" mt={5}>
                    Click the microphone button below to begin your conversation
                  </Text>
                </Box>
              )}

              {/* Controls Section */}
              <Group 
                position="center" 
                spacing="xl"
                mt={40}
                sx={(theme) => ({
                  width: '100%',
                  justifyContent: 'center',
                  [theme.fn.smallerThan('sm')]: {
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: theme.spacing.xl,
                    marginTop: 20,
                  },
                })}
              >
                {!loading ? (
                  <>
                    <Box
                      sx={(theme) => ({
                        display: 'flex',
                        justifyContent: 'center',
                        padding: '20px 0',
                        '.audio-recorder': {
                          background: theme.fn.linearGradient(45, '#00F5A0', '#00D9F5') + ' !important',
                          border: 'none !important',
                          boxShadow: 'none !important',
                          '&:hover': {
                            background: theme.fn.linearGradient(45, '#00F5A0', '#00D9F5') + ' !important',
                          }
                        },
                        '.audio-recorder-mic': {
                          backgroundColor: 'transparent !important',
                          'svg': {
                            fill: 'white !important'
                          }
                        },
                        '.audio-recorder-status': {
                          color: 'white !important'
                        },
                        '.audio-recorder-timer': {
                          color: 'white !important'
                        },
                        [theme.fn.smallerThan('sm')]: {
                          padding: '10px 0',
                        }
                      })}
                    >
                      <AudioRecorder 
                        onRecordingComplete={(audioBlob) => {
                          try {
                            whisperRequest(audioBlob);
                          } catch (error) {
                            setError('Failed to process audio recording.');
                            console.error('Audio recording error:', error);
                          }
                        }}
                        downloadOnSavePress={false}
                        downloadFileExtension="wav"
                        onRecordingError={(error) => {
                          setError('Failed to access microphone. Please check your permissions.');
                          console.error('Recording error:', error);
                        }}
                      />
                    </Box>
                    {messagesArray.length > 0 && (
                      <Box
                        sx={(theme) => ({
                          padding: '20px 0',
                          [theme.fn.smallerThan('sm')]: {
                            padding: '10px 0',
                          }
                        })}
                      >
                        <Button
                          variant="gradient"
                          gradient={{ from: '#00F5A0', to: '#00D9F5' }}
                          radius="xl"
                          size="md"
                          leftIcon={<IconRefresh size={20} />}
                          onClick={() => setMessagesArray([])}
                        >
                          Start Over
                        </Button>
                      </Box>
                    )}
                  </>
                ) : (
                  <Center>
                    <Loader variant="bars" color="teal" size="xl" />
                  </Center>
                )}
              </Group>

              {error && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  title="Error"
                  color="red"
                  variant="light"
                  radius="md"
                >
                  {error}
                </Alert>
              )}
            </Stack>
          </Paper>

          <Paper
            radius="lg"
            p={{ base: 'md', sm: 'xl' }}
            sx={(theme) => ({
              background: theme.fn.linearGradient(
                45,
                theme.fn.rgba('#00F5A0', 0.05),
                theme.fn.rgba('#00D9F5', 0.05)
              ),
              border: `1px solid ${theme.fn.rgba(theme.colors.gray[2], 0.3)}`,
            })}
          >
            <Group 
              position="apart" 
              align="center"
              sx={(theme) => ({
                [theme.fn.smallerThan('xs')]: {
                  flexDirection: 'column',
                  gap: theme.spacing.md,
                },
              })}
            >
              <Box>
                <Text size="sm" weight={500} color="dimmed">
                  CONVERSATION STATS
                </Text>
                <Group spacing="xs" mt={5}>
                  <Badge
                    variant="gradient"
                    gradient={{ from: '#00F5A0', to: '#00D9F5' }}
                  >
                    Messages: {messagesArray.length}
                  </Badge>
                  <Badge
                    variant="gradient"
                    gradient={{ from: '#00F5A0', to: '#00D9F5' }}
                  >
                    User Inputs: {messagesArray.filter(m => m.role === 'user').length}
                  </Badge>
                </Group>
              </Box>
              <Box>
                <Group spacing="xs">
                  <Tooltip label={colorScheme === 'dark' ? 'Light mode' : 'Dark mode'}>
                    <ActionIcon
                      variant="light"
                      radius="xl"
                      size="lg"
                      color="gray"
                      onClick={() => toggleColorScheme()}
                    >
                      {colorScheme === 'dark' ? (
                        <IconSun size={20} />
                      ) : (
                        <IconMoonStars size={20} />
                      )}
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Settings">
                    <ActionIcon
                      variant="light"
                      radius="xl"
                      size="lg"
                      color="gray"
                      onClick={() => alert('More settings coming soon!')}
                    >
                      <IconSettings size={20} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Box>
            </Group>
          </Paper>
        </Stack>
      </Container>
    </Fragment>
  );
}
